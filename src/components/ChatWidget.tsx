import React, { useState, useRef, useEffect } from 'react';
import { Message, sendMessageStream } from '../services/gemini';
import { Send, Bot, User, X, MessageSquare, Settings, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI chatbot. Keep your responses concise and friendly.');
  const [showSettings, setShowSettings] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      parts: [{ text: input.trim() }],
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages;
      let assistantText = '';
      
      // Add a placeholder message for the assistant
      setMessages((prev) => [...prev, { role: 'model', parts: [{ text: '' }] }]);

      const stream = sendMessageStream(history, userMessage.parts[0].text, systemPrompt);
      
      for await (const chunk of stream) {
        assistantText += chunk;
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'model',
            parts: [{ text: assistantText }],
          };
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'model', parts: [{ text: 'Sorry, I encountered an error. Please check your API key or try again later.' }] },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 flex h-[600px] w-[400px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:w-[450px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-blue-600 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <Bot size={20} />
                <span className="font-semibold">AI Assistant</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="rounded-full p-1 hover:bg-white/10 transition-colors"
                >
                  <Settings size={18} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1 hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Settings Overlay */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute inset-x-0 top-[52px] z-10 border-b bg-slate-50 p-4 shadow-md"
                >
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    System Instruction
                  </label>
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Define the bot's personality..."
                  />
                  <button
                    onClick={() => setShowSettings(false)}
                    className="mt-2 w-full rounded-md bg-blue-600 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Save & Close
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
                  <Bot size={48} className="mb-4 opacity-20" />
                  <p className="text-sm">Hello! How can I help you today?</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex w-full gap-3",
                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    msg.role === 'user' ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                  )}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                    msg.role === 'user' 
                      ? "bg-blue-600 text-white rounded-tr-none" 
                      : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
                  )}>
                    <div className="prose prose-sm prose-slate max-w-none dark:prose-invert">
                      <Markdown>{msg.parts[0].text}</Markdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex w-full gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600 animate-pulse">
                    <Bot size={16} />
                  </div>
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-2 shadow-sm">
                    <Loader2 size={16} className="animate-spin text-slate-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="border-t bg-white p-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white transition-all hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                Powered by Gemini AI
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300",
          isOpen ? "bg-slate-800 text-white" : "bg-blue-600 text-white"
        )}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>
    </div>
  );
}
