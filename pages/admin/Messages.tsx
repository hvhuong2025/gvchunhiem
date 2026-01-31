import React, { useEffect, useState, useRef } from 'react';
import provider from '../../core/provider';
import { MessageThread, Message } from '../../core/types';
import { Search, Send, User, MessageCircle } from 'lucide-react';

const Messages: React.FC = () => {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (selectedThreadId) {
      loadMessages(selectedThreadId);
      // Simple polling
      const interval = setInterval(() => loadMessages(selectedThreadId), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedThreadId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadThreads = async () => {
    const list = await provider.getAllThreads();
    setThreads(list);
  };

  const loadMessages = async (threadId: string) => {
    const list = await provider.getMessages(threadId);
    setMessages(list);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedThreadId) return;
    
    await provider.sendMessage(selectedThreadId, 'TEACHER', input);
    setInput('');
    loadMessages(selectedThreadId);
    loadThreads(); // Update lastMessageAt sorting
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredThreads = threads.filter(t => {
    const meta = JSON.parse(t.participantsJson);
    return meta.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           meta.className.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      {/* Sidebar: Thread List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
           <h2 className="text-lg font-bold text-gray-800 mb-2">Tin nhắn</h2>
           <div className="relative">
             <Search className="absolute left-2 top-2.5 text-gray-400" size={16} />
             <input 
               type="text" 
               placeholder="Tìm theo tên HS, lớp..." 
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="w-full border border-gray-300 rounded px-3 pl-8 py-2 text-sm focus:outline-none focus:border-blue-500"
             />
           </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredThreads.map(t => {
            const meta = JSON.parse(t.participantsJson);
            const isSelected = selectedThreadId === t.id;
            return (
              <div 
                key={t.id} 
                onClick={() => setSelectedThreadId(t.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
              >
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-gray-800">{meta.studentName}</span>
                  <span className="text-xs text-gray-400">{new Date(t.lastMessageAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                   <span>Lớp: {meta.className}</span>
                   {meta.parentName && <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">PH: {meta.parentName}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main: Chat Box */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedThreadId ? (
          <>
             {/* Header */}
             <div className="p-4 border-b border-gray-200 flex items-center bg-white shadow-sm z-10">
               <div className="bg-blue-100 p-2 rounded-full mr-3 text-blue-600">
                 <User size={20} />
               </div>
               <div>
                  <h3 className="font-bold text-gray-800">
                    {JSON.parse(threads.find(t => t.id === selectedThreadId)?.participantsJson || '{}').studentName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Phụ huynh: {JSON.parse(threads.find(t => t.id === selectedThreadId)?.participantsJson || '{}').parentName}
                  </p>
               </div>
             </div>

             {/* Messages Area */}
             <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
               {messages.length === 0 && <div className="text-center text-gray-400 mt-10">Bắt đầu cuộc trò chuyện...</div>}
               {messages.map(msg => {
                 const isMe = msg.fromRole === 'TEACHER';
                 return (
                   <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[70%] rounded-lg px-4 py-2 shadow-sm ${isMe ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                     </div>
                   </div>
                 );
               })}
               <div ref={messagesEndRef} />
             </div>

             {/* Input Area */}
             <div className="p-4 border-t border-gray-200 bg-white">
               <form onSubmit={handleSend} className="flex gap-2">
                 <input 
                   type="text" 
                   value={input}
                   onChange={e => setInput(e.target.value)}
                   placeholder="Nhập tin nhắn..."
                   className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500"
                 />
                 <button 
                   type="submit" 
                   disabled={!input.trim()}
                   className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50"
                 >
                   <Send size={20} className="ml-0.5" />
                 </button>
               </form>
             </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageCircle size={48} className="mb-4 text-gray-200" />
            <p>Chọn một hội thoại để bắt đầu nhắn tin</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;