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
import { FloatingElements } from './components/FloatingElements';

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
  const [lastQueryResult, setLastQueryResult] = useState<any>(null); // Store the last query response for visualization
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
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white'
        : 'bg-gradient-to-br from-blue-50 via-white to-sky-50 text-gray-900'
    } overflow-hidden relative transition-colors duration-300`}>
      <FloatingElements />
      <Header theme={theme} onThemeToggle={toggleTheme} />

      <main className="container mx-auto px-4 py-6 space-y-6 relative z-10">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'overview', label: '🌊 Overview' },
            { id: 'map', label: '🌐 Map View' },
            { id: 'profiles', label: '📊 Profiles' },
            { id: 'chat', label: '💬 Chat with Nerida' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as typeof activeSection)}
              className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                activeSection === tab.id
                  ? theme === 'dark'
                    ? 'bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/25'
                    : 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : theme === 'dark'
                  ? 'bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm text-white'
                  : 'bg-gray-200/70 hover:bg-gray-300/70 backdrop-blur-sm text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Chat Section */}
        {activeSection === 'chat' ? (
          <div className="flex flex-col items-center justify-center">
            <div className="bg-slate-900 rounded-xl border border-slate-700/50 shadow-lg w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
              
              {/* Chat Header with Back Button */}
              <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                <button
                  onClick={() => setActiveSection('overview')}
                  className="px-3 py-1 bg-slate-700 rounded-lg hover:bg-slate-600 transition"
                >
                  ← Back
                </button>
                <h3 className="font-semibold text-xl">Chat with Nerida</h3>
                <div /> {/* Placeholder for spacing */}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 max-h-60">
                <ChatPanel
                  messages={chatMessages}
                  setMessages={setChatMessages}
                  compact={false}
                  onQueryResult={setLastQueryResult}
                />
              </div>

              {/* Visualization Section */}
              {lastQueryResult && (
                <div className="flex-1 overflow-y-auto p-4 border-t">
                  <h3 className="text-xl font-bold mb-4">Query Results</h3>

                  {/* Temperature Profile */}
                  <div className="mb-6">
                    <ProfileView selectedFloat={selectedFloat} plotData={lastQueryResult.plot} />
                  </div>

                  {/* Salinity Map */}
                  <div className="mb-6">
                    <MapView selectedFloat={selectedFloat} setSelectedFloat={setSelectedFloat} theme={theme} mapPoints={lastQueryResult?.map?.points} />
                  </div>
                </div>
              )}
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
                      <ProfileView selectedFloat={selectedFloat} plotData={lastQueryResult?.plot} />
                    </div>
                    <div className="w-full max-w-[1200px] mx-auto">
                      <MapView selectedFloat={selectedFloat} setSelectedFloat={setSelectedFloat} theme={theme} mapPoints={lastQueryResult?.map?.points} />
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
                compact={true}
                onQueryResult={setLastQueryResult}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
