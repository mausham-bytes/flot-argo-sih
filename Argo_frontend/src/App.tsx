// import React, { useState } from 'react';
// import { Header } from './components/Header';
// import { MapView } from './components/MapView';
// import { ProfileView } from './components/ProfileView';
// import { SummaryCards } from './components/SummaryCards';
// import { ChatPanel } from './components/ChatPanel';
// import { FloatingElements } from './components/FloatingElements';

// // Define a type for Float if you have one, else fallback to 'any'
// interface FloatData {
//   id: string;
//   [key: string]: unknown;
// }

// function App() {
//   const [activeSection, setActiveSection] = useState<'overview' | 'map' | 'profiles' | 'chat'>('overview');
//   const [selectedFloat, setSelectedFloat] = useState<FloatData | null>(null);
//   const [chatMessages, setChatMessages] = useState([
//     {
//       id: 1,
//       sender: 'nerida',
//       message:
//         "Hello! I'm Nerida, your friendly AI oceanographer. I'm here to help you explore ARGO float data. What would you like to discover about our oceans today?",
//       timestamp: new Date(),
//     },
//   ]);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white overflow-hidden relative">
//       <FloatingElements />

//       <Header />

//       <main className="container mx-auto px-4 py-6 space-y-6 relative z-10">
//         {/* Navigation Tabs */}
//         <div className="flex flex-wrap gap-2 mb-6">
//           {[
//             { id: 'overview', label: '🌊 Overview' },
//             { id: 'map', label: '🌐 Map View' },
//             { id: 'profiles', label: '📊 Profiles' },
//             { id: 'chat', label: '💬 Chat with Nerida' },
//           ].map((tab) => (
//             <button
//               key={tab.id}
//               onClick={() => setActiveSection(tab.id as typeof activeSection)}
//               className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
//                 activeSection === tab.id
//                   ? 'bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/25'
//                   : 'bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm'
//               }`}
//             >
//               {tab.label}
//             </button>
//           ))}
//         </div>

//         {/* Main Content Grid */}
//         <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
//           {/* Primary Content Area */}
//           <div className="xl:col-span-3 space-y-6">
//             {activeSection === 'overview' && (
//   <div className="space-y-6">
//     {/* Summary cards scrollable */}
//     <div className="overflow-x-auto pb-4">
//       <div className="min-w-[700px]">
//         <SummaryCards />
//       </div>
//     </div>

//     {/* Map + Graph/Pie stacked, same width */}
//     <div className="flex flex-col gap-6">
//       {/* Map */}
//        {/* Graph + Pie Chart */}
//       <div className="w-full max-w-[1200px] mx-auto">
//         <ProfileView selectedFloat={selectedFloat} />
//       </div>
//       <div className="w-full max-w-[1200px] mx-auto">
//         <MapView selectedFloat={selectedFloat} setSelectedFloat={setSelectedFloat} />
//       </div>

     
//     </div>
//   </div>
// )}


//             {activeSection === 'map' && (
//               <div className="overflow-x-auto pb-4">
//                 <div className="min-w-[700px]">
//                   <MapView selectedFloat={selectedFloat} setSelectedFloat={setSelectedFloat} />
//                 </div>
//               </div>
//             )}

//             {activeSection === 'profiles' && (
//               <div className="overflow-x-auto pb-4">
//                 <div className="min-w-[700px]">
//                   <ProfileView selectedFloat={selectedFloat} />
//                 </div>
//               </div>
//             )}

//             {/* Full chat section */}
//     {activeSection === 'chat' && (
//       <div className="overflow-x-auto pb-2">
//         <div className="min-w-[500px] h-[600px]">   {/* ⬅️ increased height */}
//           <ChatPanel
//             messages={chatMessages}
//             setMessages={setChatMessages}
//             selectedFloat={selectedFloat}
//           />
//         </div>
//       </div>
//     )}
//           </div>

//           {/* Sidebar (Chat only, isolated card) */}
//           <div className="xl:col-span-1 space-y-6">
//             {activeSection !== 'chat' && (
//               <div className="overflow-x-auto">
//                 <div className="min-w-[350px]">
//                   <ChatPanel
//                     messages={chatMessages.slice(-3)}
//                     setMessages={setChatMessages}
//                     selectedFloat={selectedFloat}
//                     compact={true}
//                   />
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }

// export default App;

import { useState } from 'react';
import { Header } from './components/Header';
import { MapView } from './components/MapView';
import { ProfileView } from './components/ProfileView';
import { SummaryCards } from './components/SummaryCards';
import { ChatPanel } from './components/ChatPanel';
import { FloatingElements } from './components/FloatingElements.tsx';

interface FloatData {
  id: string;
  [key: string]: unknown;
}

interface Message {
  id: number;
  sender: 'user' | 'nerida';
  message: string;
  timestamp: Date;
}

function App() {
  const [activeSection, setActiveSection] = useState<'overview' | 'map' | 'profiles' | 'chat'>('overview');
  const [selectedFloat, setSelectedFloat] = useState<FloatData | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'nerida' as const,
      message:
        "Hello! I'm Nerida, your friendly AI oceanographer. I'm here to help you explore ARGO float data. What would you like to discover about our oceans today?",
      timestamp: new Date(),
    },
  ]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`min-h-screen ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-bg-slate-900 via-slate-800 to-slate-900 text-text-white'
        : 'bg-gradient-to-br from-gray-50 via-sky-50 to-blue-100 text-gray-900'
    } overflow-hidden relative transition-colors duration-500`}>
      <FloatingElements />

      <Header theme={theme} onThemeToggle={toggleTheme} />

      <main className="container mx-auto px-4 lg:px-8 py-8 space-y-8 relative z-10 animate-fade-in">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-3 justify-center lg:justify-start animate-slide-up">
          {[
            { id: 'overview', label: '🌊 Overview', icon: 'wave' },
            { id: 'map', label: '🌐 Map View', icon: 'map' },
            { id: 'profiles', label: '📊 Profiles', icon: 'chart' },
            { id: 'chat', label: '💬 Chat with Nerida', icon: 'chat' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as typeof activeSection)}
              className={`relative group px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform ${
                activeSection === tab.id
                  ? theme === 'dark'
                    ? 'bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/30 scale-105 animate-glow'
                    : 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105 animate-glow'
                  : theme === 'dark'
                  ? 'bg-slate-800/80 hover:bg-slate-700/80 text-text-white/80 shadow-md hover:shadow-lg'
                  : 'bg-white/80 hover:bg-gray-50/80 text-gray-900/80 shadow-md hover:shadow-lg'
              } backdrop-blur-sm hover:transform hover:scale-102`}
            >
              <span className="relative z-10">{tab.label}</span>
              {activeSection === tab.id && (
                <div className={`absolute inset-0 ${
                  theme === 'dark' ? 'bg-cyan-500/20' : 'bg-blue-600/20'
                } rounded-2xl animate-pulse`}></div>
              )}
            </button>
          ))}
        </div>

        {/* Chat Section */}
        {activeSection === 'chat' ? (
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <div className={`rounded-2xl border shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-slate-800/95 to-slate-900/95 border-slate-700/50 backdrop-blur-xl'
                : 'bg-white/95 border-gray-200/50 backdrop-blur-xl'
            }`}>
              {/* Chat Header with Back Button */}
              <div className={`flex items-center justify-between p-6 border-b ${
                theme === 'dark' ? 'border-slate-700/50' : 'border-gray-200/50'
              }`}>
                <button
                  onClick={() => setActiveSection('overview')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    theme === 'dark'
                      ? 'bg-slate-800 hover:bg-slate-700 text-text-white shadow-lg'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900 shadow-lg'
                  }`}
                >
                  ← Back to Dashboard
                </button>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 bg-success rounded-full animate-pulse`}></div>
                    <span className={`font-semibold text-xl ${
                      theme === 'dark' ? 'text-text-white' : 'text-gray-900'
                    }`}>Chat with Nerida</span>
                  </div>
                </div>
                <div className="w-32" /> {/* Placeholder for centering */}
              </div>

              {/* Chat Messages */}
              <div className={`flex-1 overflow-y-auto ${
                theme === 'dark' ? 'scrollbar-thin scrollbar-thumb-slate-600' : 'scrollbar-thin scrollbar-thumb-gray-300'
              }`}>
                <div className="p-6">
                  <ChatPanel
                    messages={chatMessages}
                    setMessages={setChatMessages}
                    selectedFloat={selectedFloat}
                    compact={false}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Main Content Grid (Overview / Map / Profiles)
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3 space-y-6">
              {activeSection === 'overview' && (
                <div className="space-y-6">
                  <div className="overflow-x-auto pb-4">
                    <div className="min-w-[700px]">
                      <SummaryCards />
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    <div className="w-full max-w-[1200px] mx-auto">
                      <ProfileView selectedFloat={selectedFloat} />
                    </div>
                    <div className="w-full max-w-[1200px] mx-auto">
                      <MapView selectedFloat={selectedFloat} setSelectedFloat={setSelectedFloat} theme={theme} />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'map' && (
                <MapView selectedFloat={selectedFloat} setSelectedFloat={setSelectedFloat} theme={theme} />
              )}

              {activeSection === 'profiles' && (
                <ProfileView selectedFloat={selectedFloat} />
              )}
            </div>

            <div className="xl:col-span-1 space-y-6">
              <ChatPanel
                messages={chatMessages.slice(-3)}
                setMessages={setChatMessages}
                selectedFloat={selectedFloat}
                compact={true}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
