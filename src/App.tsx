/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import ChatBox from './components/ChatBox';

export default function App() {
  return (
    <div className="h-screen w-screen bg-[#0a0a0a] font-sans text-slate-200 overflow-hidden flex flex-col">
      <ChatBox />
    </div>
  );
}
