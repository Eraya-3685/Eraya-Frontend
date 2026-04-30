import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Send, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useChatStore from '../../store/useChatStore';

const ChatMessage = ({ msg, isMe, onReply, showName, isAdminView, setConfirmModal, isSelectionMode, isSelected, onSelect }) => {
  const { deleteMessage, setEditingMessage } = useChatStore();
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className={`flex items-center gap-4 w-full group/msg relative ${isSelectionMode ? 'cursor-pointer hover:bg-slate-50/50 transition-colors px-4 rounded-2xl' : ''}`}
      onClick={() => isSelectionMode && onSelect(msg.id)}
    >
      {isSelectionMode && (
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${isSelected ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-600/20' : 'border-slate-300 bg-white'}`}>
          {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
        </div>
      )}
      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} flex-grow min-w-0 relative py-1`}>
        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isAdminView ? 'max-w-[70%]' : 'max-w-[85%]'} min-w-0 relative`}>
          {/* Reply Button */}
          {!isSelectionMode && (
            <button
              onClick={() => onReply(msg)}
              className={`absolute top-1/2 -translate-y-1/2 ${isMe ? (isAdminView ? '-left-10' : '-left-8') : (isAdminView ? '-right-10' : '-right-8')} p-1.5 rounded-full bg-white shadow-sm border border-slate-100 opacity-0 group-hover/msg:opacity-100 transition-all hover:bg-slate-50 text-slate-400 hover:text-slate-900 z-10`}
              title="Reply"
            >
              <Send className={`w-2.5 h-2.5 rotate-180 ${isAdminView ? 'w-3 h-3' : ''}`} />
            </button>
          )}

          {/* Replied Preview */}
          {msg.reply_to_id && (
            <div className={`mb-1 p-2 rounded-xl bg-slate-100/50 border-l-2 border-slate-300 ${isAdminView ? 'text-[10px]' : 'text-[9px]'} opacity-70 line-clamp-1 max-w-full italic`}>
              {msg.reply_to_text}
            </div>
          )}

          <div
            className={`p-3 rounded-2xl ${isAdminView ? 'text-xs p-3.5' : 'text-[11px]'} font-semibold shadow-sm transition-all hover:shadow-md w-fit max-w-full ${isMe
              ? 'bg-indigo-50/80 text-indigo-900 rounded-br-none border border-indigo-100/50'
              : 'bg-white text-slate-700 rounded-bl-none border border-slate-100'
              }`}
          >
            <div className={`flex flex-wrap items-end ${isAdminView ? 'gap-x-4' : 'gap-x-3'} gap-y-1 min-w-0`}>
              <div className="flex-grow whitespace-pre-wrap break-words [overflow-wrap:anywhere] min-w-0">
                {msg.message_text}
              </div>
              <div className={`${isAdminView ? 'text-[9px]' : 'text-[8px]'} font-bold tracking-tight opacity-40 whitespace-nowrap ml-auto`}>
                {msg.status === 'sending' ? 'Sending...' : format(new Date(msg.created_at || new Date()), 'hh:mm a')}
              </div>
            </div>
          </div>

          {/* Edit/Delete Controls for Admin */}
          {isAdminView && isMe && (
            <div className={`absolute top-0 ${isMe ? 'left-full -ml-3' : 'left-full ml-2'} opacity-0 group-hover/msg:opacity-100 transition-all z-20`} ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-full bg-white border border-slate-100 shadow-sm text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, x: 10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 10 }}
                    className="absolute bottom-0 right-full mr-2 w-36 bg-white/90 backdrop-blur-md rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-white/20 overflow-hidden z-30 p-1.5 flex flex-col gap-1"
                  >
                    <button
                      onClick={() => { setEditingMessage(msg); setShowMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-indigo-500 hover:text-white rounded-xl transition-all group/item"
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center group-hover/item:bg-white/20 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </div>
                      Edit Message
                    </button>
                    <button
                      onClick={() => {
                        setConfirmModal({
                          show: true,
                          title: 'Delete Message?',
                          message: 'Are you sure you want to remove this message? This will delete it for everyone.',
                          onConfirm: () => deleteMessage(msg.id)
                        });
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all group/item"
                    >
                      <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center group-hover/item:bg-white/20 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </div>
                      Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {showName && (
            <span className={`${isAdminView ? 'text-[7px]' : 'text-[6px]'} font-bold text-slate-400 mt-1 px-1 `}>
              {!isAdminView && !isMe ? 'Eraya Support' : msg.sender_name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const DateSeparator = ({ date }) => {
  const msgDate = new Date(date);
  let dateLabel = '';
  if (isToday(msgDate)) dateLabel = 'Today';
  else if (isYesterday(msgDate)) dateLabel = 'Yesterday';
  else dateLabel = format(msgDate, 'MMMM d, yyyy');

  return (
    <div className="flex justify-center my-6">
      <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[8px]  rounded-full shadow-sm">
        {dateLabel}
      </span>
    </div>
  );
};

export default ChatMessage;
