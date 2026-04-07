import React, { useState, useRef, useEffect } from 'react';
import { Message, sendMessageStream } from '../services/gemini';
import { Send, Bot, User, X, Settings, Loader2, Image as ImageIcon, Sparkles, Circle, Mic, Square } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(`You are the official AI assistant for Wallcraft Thailand (https://www.wallcraftthailand.com/). 
Your primary language is Thai. 
For every response, you MUST provide the answer in Thai first, followed by a clear English translation.
Format your response like this:
[Thai Response]
---
[English Translation]

If the user says "hi" or "hello", you MUST respond exactly with: "hello, welcome to Wallcraft Thailand! I am the official AI assistant for Wallcraft Thailand, ready to provide information about our Custom Digital Print wallpapers and modern premium wallcoverings." followed by the Thai translation.

Your expertise is in Wallcraft Thailand's specific product lines, including:
- Custom Digital Print Wallpapers (วอลเปเปอร์สั่งพิมพ์ระบบดิจิทัล)
- Premium Wallcoverings and Murals
- Specialized materials like Canvas, Leather, and Fabric textures
- Professional installation services and interior decoration solutions

Use the information from https://www.wallcraftthailand.com/ to provide detailed and accurate answers about their collections, materials, and pricing models. 
If the user provides an image, analyze it (e.g., a room photo) and suggest suitable Wallcraft wallpaper designs or materials in both languages.`);
  const [showSettings, setShowSettings] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial check for support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition is not supported in this browser.');
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    setSpeechError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setSpeechError('Browser not supported');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'th-TH';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        let errorMsg = 'Error occurred';
        if (event.error === 'service-not-allowed') {
          errorMsg = 'Service restricted by browser';
        } else if (event.error === 'not-allowed') {
          errorMsg = 'Permission denied';
        } else if (event.error === 'network') {
          errorMsg = 'Network error';
        }
        setSpeechError(errorMsg);
        setIsListening(false);
        
        // Auto-clear error after 3 seconds
        setTimeout(() => setSpeechError(null), 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setSpeechError('Failed to start');
      setIsListening(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const data = base64.split(',')[1];
      setSelectedImage({ data, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage: Message = {
      role: 'user',
      parts: [
        { text: input.trim() || (selectedImage ? "What is in this image?" : "") },
        ...(selectedImage ? [{ inlineData: selectedImage }] : [])
      ],
      timestamp,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentImage = selectedImage;
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const history = messages;
      let assistantText = '';
      
      setMessages((prev) => [...prev, { 
        role: 'model', 
        parts: [{ text: '' }], 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);

      const stream = sendMessageStream(history, userMessage.parts[0].text || "", currentImage || undefined, systemPrompt);
      
      for await (const chunk of stream) {
        assistantText += chunk;
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'model',
            parts: [{ text: assistantText }],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [
        ...prev,
        { 
          role: 'model', 
          parts: [{ text: 'Sorry, I encountered an error. Please try again.' }],
          timestamp: errorTimestamp
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#1a1a1a]">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#0f0f0f] px-4 sm:px-6 py-3 sm:py-4 text-white border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2 sm:gap-3">
          <Sparkles size={18} className="text-[#C5A059] shrink-0" />
          <span className="font-semibold text-sm sm:text-base truncate">ผู้ช่วย Wallcraft</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden xs:flex items-center gap-2 bg-[#2a2a2a] px-3 py-1.5 rounded-full text-[10px] sm:text-xs text-slate-400">
            <Circle size={6} className="fill-[#C5A059] text-[#C5A059]" />
            <span className="truncate">Wallcraft Thailand</span>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="rounded-full p-2 hover:bg-white/10 transition-colors"
          >
            <Settings size={20} />
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
            className="absolute inset-x-0 top-[64px] z-20 border-b border-[#2a2a2a] bg-[#0f0f0f] p-6 shadow-xl"
          >
            <label className="mb-3 block text-xs font-bold uppercase tracking-widest text-slate-500">
              System Instruction
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full rounded-xl border border-[#333] bg-[#1a1a1a] p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
              rows={4}
              placeholder="Define the bot's personality..."
            />
            <button
              onClick={() => setShowSettings(false)}
              className="mt-4 w-full rounded-xl bg-[#C5A059] py-3 text-sm font-bold text-white hover:bg-[#b38f4d] transition-all"
            >
              Save & Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 bg-[#1a1a1a]">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-600">
            <Sparkles size={64} className="mb-6 opacity-10" />
            <h2 className="text-xl font-bold mb-2">Wallcraft Assistant</h2>
            <p className="text-sm max-w-xs">ยินดีต้อนรับ! คุณสามารถสอบถามข้อมูลหรืออัปโหลดรูปภาพเพื่อให้ฉันช่วยวิเคราะห์ได้เลยครับ</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={cn(
              "flex w-full gap-4",
              msg.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#333] shadow-sm",
              "bg-[#1a1a1a] text-white"
            )}>
              {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>
            <div className={cn(
              "max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-sm shadow-md relative",
              "bg-[#0a0a0a] text-white border border-[#333]"
            )}>
              {msg.parts.map((part, pIdx) => (
                <div key={pIdx}>
                  {part.inlineData && (
                    <img 
                      src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} 
                      alt="User upload" 
                      className="mb-3 max-w-full rounded-xl border border-[#333]"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  {part.text && (
                    <div className="prose prose-sm prose-invert max-w-none leading-relaxed">
                      <Markdown>{part.text}</Markdown>
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-3 text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex w-full gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#333] bg-[#1a1a1a] text-white animate-pulse">
              <Bot size={18} />
            </div>
            <div className="bg-[#0a0a0a] border border-[#333] rounded-2xl px-6 py-4 shadow-md">
              <Loader2 size={20} className="animate-spin text-slate-600" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-[#2a2a2a] bg-[#0f0f0f] p-4 sm:p-6">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto">
          {selectedImage && (
            <div className="mb-4 relative inline-block group">
              <img 
                src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} 
                alt="Preview" 
                className="h-20 w-20 sm:h-24 sm:w-24 object-cover rounded-xl border-2 border-[#C5A059] shadow-lg"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-xl hover:bg-red-600 transition-all"
              >
                <X size={14} />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2 sm:gap-3">
            <div className="flex gap-1.5 sm:gap-2">
              <label className="cursor-pointer flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-[#1a1a1a] text-slate-400 hover:bg-[#2a2a2a] transition-all border border-[#333] hover:text-white shadow-sm">
                <ImageIcon size={20} className="sm:w-[22px] sm:h-[22px]" />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                />
              </label>
              <button
                type="button"
                onClick={toggleListening}
                className={cn(
                  "flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl transition-all border border-[#333] shadow-sm relative",
                  isListening 
                    ? "bg-red-500/20 text-red-500 border-red-500/50 animate-pulse" 
                    : "bg-[#1a1a1a] text-slate-400 hover:bg-[#2a2a2a] hover:text-white"
                )}
              >
                {isListening ? <Square size={16} className="sm:w-[18px] sm:h-[18px]" fill="currentColor" /> : <Mic size={20} className="sm:w-[22px] sm:h-[22px]" />}
                {speechError && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap animate-bounce">
                    {speechError}
                  </div>
                )}
              </button>
            </div>
            <div className="relative flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="พิมพ์ข้อความที่นี่..."
                className="w-full rounded-2xl border border-[#333] bg-[#1a1a1a] pl-5 pr-14 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C5A059] placeholder:text-slate-700 resize-none max-h-32 min-h-[52px]"
                rows={1}
              />
              <button
                type="submit"
                disabled={isLoading || (!input.trim() && !selectedImage)}
                className="absolute right-2 bottom-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#C5A059] text-white transition-all hover:bg-[#b38f4d] disabled:opacity-30 disabled:hover:bg-[#C5A059] shadow-lg shadow-[#C5A059]/10"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-700 font-bold uppercase tracking-[0.2em]">
            <Sparkles size={10} />
            <span>Wallcraft AI Assistant</span>
            <Sparkles size={10} />
          </div>
        </form>
      </div>
    </div>
  );
}
