import React, { useState, useRef, useEffect } from 'react';
import { Paper, ChatMessage } from '../types';
import { queryRepository } from '../services/geminiService';
import { Send, Bot, User as UserIcon, Loader2, Sparkles } from 'lucide-react';

interface ChatAssistantProps {
  papers: Paper[];
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ papers }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: `Hello! I'm your Research Assistant. I have read all ${papers.length} papers in your repository.\n\nYou can ask me to:\n• Summarize research on Fraud Detection\n• Compare methodologies between papers\n• Explain the trend in Agentic AI workflows`,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Filter history for context (exclude the very first greeting if needed, but keeping it is fine)
    // We pass the messages *before* the current one to the service if we want true history, 
    // but the service takes the full history list to init the chat.
    // However, the `queryRepository` function signature I designed takes history + new message.
    // Let's pass the history excluding the new one we just added locally for the UI.
    
    const responseText = await queryRepository(messages, userMsg.text, papers);
    
    const modelMsg: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
    setMessages(prev => [...prev, modelMsg]);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex items-center gap-2">
        <Sparkles className="text-purple-400" />
        <h2 className="text-lg font-bold text-white">Repository Assistant</h2>
        <span className="text-xs text-slate-500 ml-auto bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
          Context: {papers.length} Papers
        </span>
      </div>

      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`
              flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
              ${msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'}
            `}>
              {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`
              max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap
              ${msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-sm' 
                : 'bg-slate-700 text-slate-100 rounded-tl-sm border border-slate-600'}
            `}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
             <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                <Bot size={16} />
             </div>
             <div className="bg-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 border border-slate-600 flex items-center gap-2 text-slate-400">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-xs">Analyzing repository...</span>
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900 border-t border-slate-700">
        <div className="flex gap-2 relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your research collection..."
            className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-4 pr-12 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none h-14 custom-scrollbar"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-2 top-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-center text-xs text-slate-500 mt-2">
          AI generated answers based strictly on your collected papers.
        </p>
      </div>
    </div>
  );
};

export default ChatAssistant;