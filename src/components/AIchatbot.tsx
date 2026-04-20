'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Settings, Loader2, Image as ImageIcon, Sparkles, Circle, Mic, Square, Crop as CropIcon, Check, MessageCircle } from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import ReactCrop, { type Crop, PixelCrop } from 'react-image-crop';
import { sendMessageStream, type Message } from '../services/gemini'; 
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AIchatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');
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
Keep your responses concise and informative to stay within token limits.

When an image is provided:
1. Provide a VERY DETAILED description of the image content, focusing on textures, colors, lighting, and spatial arrangement.
2. If a specific area was selected (cropped), focus your analysis primarily on that region.
3. Suggest suitable Wallcraft wallpaper designs or materials that would complement the scene or match the style in the image.
4. Explain WHY these suggestions work based on the visual elements identified.
5. Provide all this information in both Thai and English as per the standard format.`);
  
  const [showSettings, setShowSettings] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imgSrc, setImgSrc] = useState('');
  const [isCropping, setIsCropping] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('Browser not supported');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'th-TH';
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (err) {
      setIsListening(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImgSrc(reader.result as string);
      setIsCropping(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = async () => {
    if (!imgRef.current || !completedCrop) {
      const data = imgSrc.split(',')[1];
      const mimeType = imgSrc.split(';')[0].split(':')[1];
      setSelectedImage({ data, mimeType });
      setIsCropping(false);
      return;
    }

    const canvas = document.createElement('canvas');
    const image = imgRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0, 0, completedCrop.width, completedCrop.height
      );
    }

    const base64 = canvas.toDataURL('image/jpeg');
    setSelectedImage({ data: base64.split(',')[1], mimeType: 'image/jpeg' });
    setIsCropping(false);
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

    const currentHistory = [...messages];
    setMessages((prev) => [...prev, userMessage]);
    const currentImage = selectedImage;
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      let assistantText = '';
      setMessages((prev) => [...prev, { 
        role: 'model', 
        parts: [{ text: '' }], 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);

      const stream = sendMessageStream(
        currentHistory, 
        userMessage.parts[0].text || "", 
        currentImage || undefined, 
        systemPrompt,
        userApiKey
      );
      
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-[#C5A059] text-white shadow-2xl transition-transform hover:scale-110 active:scale-95"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        {!isOpen && messages.length === 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold animate-bounce">1</span>
        )}
      </button>

      {/* Messenger Box */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-[9998] flex h-[600px] w-[90vw] max-w-[400px] flex-col overflow-hidden rounded-3xl border border-[#2a2a2a] bg-[#1a1a1a] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-[#0f0f0f] px-5 py-4 text-white border-b border-[#2a2a2a]">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Sparkles size={18} className="text-[#C5A059]" />
                  <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 border border-[#0f0f0f]" />
                </div>
                <div>
                  <p className="text-sm font-bold">Wallcraft Assistant</p>
                  <p className="text-[10px] text-slate-500">Online | พร้อมช่วยเหลือ</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowSettings(!showSettings)} className="rounded-full p-1.5 hover:bg-white/10 text-slate-400">
                  <Settings size={18} />
                </button>
                <button onClick={() => setIsOpen(false)} className="rounded-full p-1.5 hover:bg-white/10 text-slate-400">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Settings Overlay */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#0f0f0f] border-b border-[#2a2a2a] overflow-hidden"
                >
                  <div className="p-4">
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Gemini API Key (Optional Fallback)
                    </label>
                    <input
                      type="password"
                      value={userApiKey}
                      onChange={(e) => setUserApiKey(e.target.value)}
                      placeholder="Paste your API key here if needed..."
                      className="w-full mb-4 rounded-xl border border-[#333] bg-[#1a1a1a] p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                    />
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      System Instruction
                    </label>
                    <textarea
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      className="w-full rounded-xl border border-[#333] bg-[#1a1a1a] p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                      rows={4}
                    />
                    <button
                      onClick={() => setShowSettings(false)}
                      className="mt-3 w-full rounded-xl bg-[#C5A059] py-2 text-xs font-bold text-white hover:bg-[#b38f4d] transition-all"
                    >
                      Save & Close
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#1a1a1a] scrollbar-hide">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center p-6">
                  <Bot size={40} className="text-[#C5A059] mb-4 opacity-20" />
                  <p className="text-xs text-slate-500">สวัสดีครับ! มีอะไรให้ช่วยเกี่ยวกับวอลเปเปอร์ Wallcraft ไหมครับ?</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={cn("flex w-full gap-2", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-[12px] shadow-sm border border-[#333]",
                    msg.role === 'user' ? "bg-[#C5A059] text-white border-none" : "bg-[#0a0a0a] text-white"
                  )}>
                    {msg.parts.map((part, pIdx) => (
                      <div key={pIdx}>
                        {part.inlineData && <img src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} className="mb-2 rounded-lg max-w-full" />}
                        {part.text && <div className="prose prose-invert prose-sm max-w-none"><Markdown>{part.text}</Markdown></div>}
                      </div>
                    ))}
                    <div className="mt-1 text-[9px] opacity-50 text-right">
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex w-full gap-2">
                  <div className="bg-[#0a0a0a] border border-[#333] rounded-2xl px-4 py-2 shadow-sm">
                    <Loader2 size={16} className="animate-spin text-slate-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-[#2a2a2a] bg-[#0f0f0f] p-3">
              <form onSubmit={handleSend} className="flex flex-col gap-2">
                {selectedImage && (
                  <div className="relative inline-block w-14">
                    <img src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} className="h-14 w-14 rounded-lg border border-[#C5A059]" />
                    <button type="button" onClick={() => setSelectedImage(null)} className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5"><X size={10} /></button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <label className="cursor-pointer text-slate-400 hover:text-white p-1">
                      <ImageIcon size={18} /><input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={cn("p-1 transition-colors", isListening ? "text-red-500 animate-pulse" : "text-slate-400 hover:text-white")}
                    >
                      {isListening ? <Square size={16} fill="currentColor" /> : <Mic size={18} />}
                    </button>
                  </div>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="ถามคำถามที่นี่..."
                    className="flex-1 rounded-full border border-[#333] bg-[#1a1a1a] px-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                  />
                  <button type="submit" disabled={isLoading} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C5A059] text-white disabled:opacity-50">
                    {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crop Modal */}
      <AnimatePresence>
        {isCropping && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 p-4">
            <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-[#2a2a2a] max-w-2xl w-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-white">
                  <CropIcon size={18} className="text-[#C5A059]" />
                  <span className="font-semibold text-sm">เลือกพื้นที่ที่ต้องการเน้น</span>
                </div>
                <button onClick={() => setIsCropping(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
              </div>
              <div className="flex items-center justify-center bg-[#1a1a1a] rounded-xl overflow-hidden mb-6">
                <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)}>
                  <img ref={imgRef} src={imgSrc} className="max-h-[60vh] mx-auto" />
                </ReactCrop>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setIsCropping(false)} className="px-6 py-2 text-sm text-white hover:bg-white/5 rounded-xl">ยกเลิก</button>
                <button onClick={handleCropComplete} className="bg-[#C5A059] px-8 py-2 rounded-xl text-sm font-bold text-white hover:bg-[#b38f4d]">ยืนยัน</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
