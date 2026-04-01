/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import ChatWidget from './components/ChatWidget';
import { Bot, Globe, Image as ImageIcon, Languages } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tight text-blue-600">
            <Languages size={32} />
            <span>ThaiAI Chat</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#" className="hover:text-blue-600 transition-colors">API</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Documentation</a>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-all shadow-md">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              <Bot size={14} />
              Powered by Gemini 3 Flash
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
              The AI Chatbot that speaks <span className="text-blue-600">Thai</span> & <span className="text-blue-600">English</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
              Experience seamless communication with our bilingual AI. 
              Ask questions in any language, upload images for analysis, 
              and get responses in Thai with instant English translations.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <Globe size={20} />
                </div>
                <h3 className="font-bold text-lg mb-2">Bilingual Support</h3>
                <p className="text-sm text-slate-500">Thai as primary language with automatic English translations for every response.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="h-10 w-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
                  <ImageIcon size={20} />
                </div>
                <h3 className="font-bold text-lg mb-2">Visual Analysis</h3>
                <p className="text-sm text-slate-500">Upload images and ask questions. Our AI understands and describes what it sees.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-chat'))}
                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
              >
                Try the Demo
              </button>
              <button className="bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all">
                View Source Code
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-blue-500/10 blur-3xl rounded-full"></div>
            <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden aspect-[4/3] flex flex-col">
              <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="mx-auto text-xs font-medium text-slate-400">ThaiAI Chat Preview</div>
              </div>
              <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
                <div className="self-end bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-tr-none text-sm max-w-[80%]">
                  สวัสดีครับ ช่วยอธิบายรูปนี้หน่อย
                </div>
                <div className="self-start bg-slate-100 text-slate-800 px-4 py-2 rounded-2xl rounded-tl-none text-sm max-w-[80%]">
                  <p className="mb-2">แน่นอนครับ! นี่คือรูปภาพของแมวสีส้มที่กำลังนอนหลับอยู่บนโซฟา ดูท่าทางมันจะมีความสุขมากเลยนะครับ</p>
                  <div className="border-t border-slate-200 my-2 pt-2 text-slate-500 italic">
                    Certainly! This is a picture of an orange cat sleeping on a sofa. It looks very happy.
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                <div className="flex-1 h-10 bg-white border border-slate-200 rounded-full px-4 flex items-center text-slate-300 text-sm">
                  พิมพ์ข้อความที่นี่...
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                  <Bot size={18} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="flex items-center justify-center gap-2 font-bold text-xl text-slate-400 mb-4">
            <Languages size={24} />
            <span>ThaiAI Chat</span>
          </div>
          <p className="text-slate-400 text-sm">© 2026 ThaiAI Chatbot. Built with Gemini AI.</p>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}
