import React from 'react';
import { X } from 'lucide-react';

const ChatReplyPreview = ({ replyingTo, onClear, isAdminView }) => {
  if (!replyingTo) return null;

  return (
    <div className={`${isAdminView ? 'mb-4 p-4' : 'mb-3 p-3'} bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between animate-in slide-in-from-bottom-2`}>
      <div className="flex items-center gap-3 overflow-hidden">
        <div className={`w-1 bg-slate-900 ${isAdminView ? 'h-8' : 'h-6'} rounded-full shrink-0`} />
        <div className="overflow-hidden">
          <p className={`${isAdminView ? 'text-[10px]' : 'text-[8px]'}  text-slate-400 mb-0.5`}>
            Replying to {!isAdminView && replyingTo.sender_id !== 0 ? 'Eraya Support' : replyingTo.sender_name}
          </p>
          <p className={`${isAdminView ? 'text-xs' : 'text-[10px]'} text-slate-600 truncate`}>
            {replyingTo.message_text}
          </p>
        </div>
      </div>
      <button
        onClick={onClear}
        className={`${isAdminView ? 'p-2' : 'p-1.5'} hover:bg-slate-200 rounded-full transition-colors`}
      >
        <X className={`${isAdminView ? 'w-4' : 'w-3.5'} h-full text-slate-400`} />
      </button>
    </div>
  );
};

export default ChatReplyPreview;
