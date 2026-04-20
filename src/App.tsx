/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import AIchatbot from './components/AIchatbot';

export default function App() {
  return (
    <div className="h-screen w-screen bg-[#0a0a0a] font-sans text-slate-200 overflow-hidden flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#C5A059] mb-4">Wallcraft Thailand</h1>
        <p className="text-slate-400 max-w-md mx-auto">
          Welcome to our official website. Click the chat bubble in the corner to talk to our AI assistant.
        </p>
      </div>
      <AIchatbot />
    </div>
  );
}
