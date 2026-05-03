import { create } from 'zustand';
import useAuthStore from './useAuthStore';
import api from '../api/axios';

const useChatStore = create((set, get) => {
  let heartbeatInterval;
  let visibilityListenerAdded = false;

  return {
    messages: [],
    conversations: [],
    socket: null,
    isConnected: false,
    isPartnerOnline: false,
    isTyping: false,
    editingMessage: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 50,
    selectedAdminConv: null,
    currentWithID: 0,
    totalUnreadCount: 0,
    isOpen: false,

    setEditingMessage: (msg) => set({ editingMessage: msg }),
    setIsOpen: (val) => set({ isOpen: val }),
    setConversations: (convs) => set({ conversations: convs }),
    setSelectedAdminConv: (conv) => set({ selectedAdminConv: conv, isPartnerOnline: false }),
    fetchTotalUnread: async () => {
      try {
        const res = await api.get('/chat/unread-count');
        set({ totalUnreadCount: res.data?.unread_count || 0 });
      } catch (err) {
        console.error('Failed to fetch unread count', err);
      }
    },

    connect: (withID) => {
      const { token } = useAuthStore.getState();
      if (!token) return;
      set({ currentWithID: withID });

      if (!visibilityListenerAdded) {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' && !get().isConnected) {
            get().connect(get().currentWithID || 0); // use current value, not stale closure
          }
        });
        visibilityListenerAdded = true;
      }

      const oldSocket = get().socket;
      if (oldSocket) {
        oldSocket.onclose = null;
        oldSocket.onerror = null;
        oldSocket.close();
      }

      const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8080/api/v1'}/chat/ws?with=${withID}&token=${token}`;
      const socket = new WebSocket(wsUrl);
      set({ socket, isConnected: false });

      socket.onopen = () => {
        set({ isConnected: true, socket, reconnectAttempts: 0 });
        get().fetchTotalUnread(); // [NEW] Fetch unread count on connect
        clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000);
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'pong') return;

          if (msg.type === 'presence') {
            set({ isPartnerOnline: msg.online });
            return;
          }

          if (msg.type === 'typing') {
            const user = useAuthStore.getState().user;
            const isAdmin = user?.role === 'admin' || user?.role === 'moderator';
            const { selectedAdminConv } = get();

            let isRelevant = false;
            if (isAdmin) {
              isRelevant = selectedAdminConv && String(selectedAdminConv.buyer_id) === String(msg.sender_id);
            } else {
              isRelevant = msg.sender_id === 0 || (selectedAdminConv && String(selectedAdminConv.admin_id) === String(msg.sender_id));
            }

            if (isRelevant) {
              set({ isTyping: msg.is_typing });
            }
            return;
          }

          if (msg.type === 'message' || msg.type === 'delete_conversation' || msg.type === 'update' || msg.type === 'delete' || msg.id) {
            set((state) => {
              const { messages, conversations, selectedAdminConv } = state;
              const user = useAuthStore.getState().user;
              const isAdmin = user?.role === 'admin' || user?.role === 'moderator';
              let nextMessages = [...messages];

              if (msg.type === 'update') {
                const idx = nextMessages.findIndex(m => String(m.id) === String(msg.id));
                if (idx !== -1) {
                  nextMessages[idx] = { ...nextMessages[idx], ...msg, status: 'sent' };
                }
                const nextConvs = conversations.map(c => 
                  String(c.id) === String(msg.conversation_id) ? { ...c, last_message: msg.message_text || c.last_message } : c
                );
                return { messages: nextMessages, conversations: nextConvs };
              }

              if (msg.type === 'delete') {
                return { messages: nextMessages.filter(m => String(m.id) !== String(msg.id)) };
              }

              if (msg.type === 'delete_conversation') {
                const isCurrentChat = (selectedAdminConv && String(selectedAdminConv.id) === String(msg.conversation_id));
                
                return { 
                  messages: isCurrentChat ? [] : messages, 
                  conversations: conversations.filter(c => String(c.id) !== String(msg.conversation_id)),
                  selectedAdminConv: isCurrentChat ? null : selectedAdminConv
                };
              }

              // Normal message processing
              let isForCurrentChat = false;
              const currentUserId = user?.id ? String(user.id) : null;

              if (isAdmin) {
                // Admin: Relevant if it's the selected conversation or involves the current 'with' ID
                isForCurrentChat = (selectedAdminConv && String(selectedAdminConv.id) === String(msg.conversation_id)) ||
                                   (String(get().currentWithID) === String(msg.sender_id) || String(get().currentWithID) === String(msg.receiver_id));
              } else {
                // Buyer only has ONE conversation (with support).
                // Backend already filtered via Redis channel chat_{buyerID},
                // so any message reaching the socket IS for this buyer.
                // Only render in UI if widget is open.
                isForCurrentChat = get().isOpen;
              }


              if (isForCurrentChat) {
                // Prevent duplicates by checking both ID and temp_id
                const existingIndex = nextMessages.findIndex(m => 
                  String(m.id) === String(msg.id) || (msg.temp_id && String(m.id) === String(msg.temp_id))
                );

                if (existingIndex !== -1) {
                  // Update existing (useful for status changes from 'sending' to 'sent')
                  nextMessages[existingIndex] = { ...nextMessages[existingIndex], ...msg, status: 'sent' };
                } else {
                  // Add as new message
                  nextMessages.push({ ...msg, status: 'sent' });
                }
              }

              const isNewMessage = !msg.type || msg.type === 'message';
              let nextConversations = [...conversations];
              const convIndex = nextConversations.findIndex(c => String(c.id) === String(msg.conversation_id));
              
              if (isNewMessage && convIndex !== -1) {
                const isSelected = selectedAdminConv && String(selectedAdminConv.id) === String(msg.conversation_id);
                const updatedConv = { 
                  ...nextConversations[convIndex], 
                  last_message: msg.message_text,
                  updated_at: msg.created_at || new Date().toISOString(),
                  unread_count: isSelected ? 0 : (nextConversations[convIndex].unread_count || 0) + 1
                };
                nextConversations.splice(convIndex, 1);
                nextConversations.unshift(updatedConv);
              } else if (isNewMessage && isAdmin && msg.conversation_id) {
                api.get('/chat/conversations').then(res => {
                  set({ conversations: res.data || [] });
                });
              }

              // Update global unread count only if it's a new message for us
              if (isNewMessage && String(msg.sender_id) !== String(user?.id) && !isForCurrentChat) {
                set(state => ({ totalUnreadCount: state.totalUnreadCount + 1 }));
              }

              return { messages: nextMessages, conversations: nextConversations };
            });
          }
        } catch (err) {
          console.error('WS Message Error:', err);
        }
      };

      socket.onclose = () => {
        clearInterval(heartbeatInterval);
        set({ isConnected: false, socket: null });
        const { reconnectAttempts, maxReconnectAttempts } = get();
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
          setTimeout(() => {
            set({ reconnectAttempts: reconnectAttempts + 1 });
            get().connect(withID);
          }, delay);
        }
      };

      socket.onerror = (err) => {
        console.error('WS Error:', err);
      };
      set({ socket });
    },

    disconnect: () => {
      const { socket } = get();
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
      set({ socket: null, isConnected: false, messages: [], reconnectAttempts: 0 });
    },

    sendMessage: (text, replyTo = null) => {
      const { socket, selectedAdminConv, connect, currentWithID } = get();
      if (socket?.readyState === WebSocket.OPEN) {
        const tempId = 'temp-' + Date.now();
        const user = useAuthStore.getState().user;
        const receiverID = selectedAdminConv ? selectedAdminConv.buyer_id : '0';
        
        const optimisticMsg = {
          id: tempId,
          message_text: text,
          sender_id: user?.id,
          sender_name: user?.full_name,
          created_at: new Date().toISOString(),
          status: 'sending',
          reply_to_id: replyTo?.id,
          reply_to_text: replyTo?.message_text
        };

        set((state) => ({ messages: [...state.messages, optimisticMsg] }));
        socket.send(JSON.stringify({ 
          text, 
          temp_id: tempId, 
          receiverID: receiverID.toString(),
          replyToID: replyTo?.id?.toString() 
        }));
        return true;
      } else {
        if (!socket || socket.readyState === WebSocket.CLOSED) {
          connect(currentWithID || 0);
        }
        return false;
      }
    },

    editMessage: (msgID, newText) => {
      const { socket } = get();
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'update',
          id: msgID.toString(),
          text: newText
        }));
      }
    },

    deleteMessage: (msgID) => {
      const { socket } = get();
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'delete',
          id: msgID.toString()
        }));
      }
    },

    bulkDeleteMessages: async (msgIDs) => {
      try {
        await api.post('/chat/messages/bulk-delete', { ids: msgIDs });
      } catch (err) {
        console.error('Failed to bulk delete messages', err);
      }
    },

    setMessages: (messages) => set({ messages: messages.map(m => ({ ...m, status: 'sent' })) }),

    sendTyping: (isTyping) => {
      const { socket, selectedAdminConv } = get();
      if (socket?.readyState === WebSocket.OPEN) {
        const receiverID = selectedAdminConv ? selectedAdminConv.buyer_id : '0';
        socket.send(JSON.stringify({
          type: 'typing',
          is_typing: isTyping ? 'true' : 'false',
          receiverID: receiverID.toString()
        }));
      }
    },
    
    markAsRead: async (convID) => {
      try {
        await api.post(`/chat/conversation/${convID}/read`);
        set((state) => {
          const conv = state.conversations.find(c => String(c.id) === String(convID));
          const unreadForThisConv = conv?.unread_count || 0;
          return {
            conversations: state.conversations.map(c => 
              String(c.id) === String(convID) ? { ...c, unread_count: 0 } : c
            ),
            totalUnreadCount: Math.max(0, state.totalUnreadCount - unreadForThisConv)
          };
        });
      } catch (err) {
        console.error('Failed to mark as read', err);
      }
    }
  };
});

export default useChatStore;
