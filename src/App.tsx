/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import ChatWidget from './components/ChatWidget';

export default function App() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Minimal Header */}
      <nav className="border-b border-slate-100 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs">AI</div>
            <span>ChatWidget SDK</span>
          </div>
          <div className="text-sm text-slate-500 font-medium">Next.js & React Integration</div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <section className="mb-16">
          <h2 className="mb-6 text-3xl font-bold tracking-tight">Integration Guide</h2>
          <p className="mb-8 text-lg text-slate-600">
            Follow these steps to add the Gemini-powered chatbot to your existing Next.js or React project.
          </p>

          <div className="space-y-12">
            {/* Step 1 */}
            <div>
              <h3 className="mb-4 flex items-center gap-3 text-xl font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-sm text-blue-700">1</span>
                Install Dependencies
              </h3>
              <pre className="overflow-x-auto rounded-xl bg-slate-900 p-5 font-mono text-sm text-blue-300 shadow-inner">
                {`npm install @google/genai lucide-react react-markdown motion clsx tailwind-merge`}
              </pre>
            </div>

            {/* Step 2 */}
            <div>
              <h3 className="mb-4 flex items-center gap-3 text-xl font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-sm text-blue-700">2</span>
                Add Tailwind Utilities
              </h3>
              <p className="mb-4 text-slate-600">Create a <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm">lib/utils.ts</code> file for class merging:</p>
              <pre className="overflow-x-auto rounded-xl bg-slate-900 p-5 font-mono text-sm text-blue-300 shadow-inner">
{`import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`}
              </pre>
            </div>

            {/* Step 3 */}
            <div>
              <h3 className="mb-4 flex items-center gap-3 text-xl font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-sm text-blue-700">3</span>
                Configure Environment
              </h3>
              <p className="mb-4 text-slate-600">Add your Gemini API key to your <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm">.env.local</code>:</p>
              <pre className="overflow-x-auto rounded-xl bg-slate-900 p-5 font-mono text-sm text-blue-300 shadow-inner">
{`NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here`}
              </pre>
            </div>

            {/* Step 4 */}
            <div>
              <h3 className="mb-4 flex items-center gap-3 text-xl font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-sm text-blue-700">4</span>
                Copy Component
              </h3>
              <p className="mb-4 text-slate-600">Copy the <code className="font-bold text-blue-600">ChatWidget.tsx</code> and <code className="font-bold text-blue-600">gemini.ts</code> files from this project into your components folder.</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-blue-50 p-8 border border-blue-100">
          <h2 className="mb-4 text-xl font-bold text-blue-900">Live Preview</h2>
          <p className="text-blue-700 opacity-80">
            The widget is active in the bottom right corner. You can test it now to see how it will behave in your own app.
          </p>
        </section>
      </main>

      <footer className="border-t border-slate-100 py-12 text-center text-sm text-slate-400">
        <p>© 2026 AI ChatWidget SDK. Built for Next.js Developers.</p>
      </footer>

      <ChatWidget />
    </div>
  );
}
