import React, { useState } from 'react';
import { Header } from './components/Header';
import { MapView } from './components/MapView';
import { ProfileView } from './components/ProfileView';
import { SummaryCards } from './components/SummaryCards';
import { ChatPanel } from './components/ChatPanel';
import { FloatingElements } from './components/FloatingElements';

// Define a type for Float if you have one, else fallback to 'any'
interface FloatData {
  id: string;
  [key: string]: unknown;
}

function App() {
  const [activeSection, setActiveSection] = useState<'overview' | 'map' | 'profiles' | 'chat'>('overview');
  const [selectedFloat, setSelectedFloat] = useState<FloatData | null>(null);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'nerida',
      message:
        "Hello! I'm Nerida, your friendly AI oceanographer. I'm here to help you explore ARGO float data. What would you like to discover about our oceans today?",
      timestamp: new Date(),
    },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white overflow-hidden relative">
      <FloatingElements />

      <Header />

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
                  ? 'bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Primary Content Area */}
          <div className="xl:col-span-3 space-y-6">
            {activeSection === 'overview' && (
              <div className="space-y-6">
                {/* Summary cards scrollable */}
                <div className="overflow-x-auto pb-4">
                  <div className="min-w-[700px]">
                    <SummaryCards />
                  </div>
                </div>

                {/* Map + Profile side by side but scrollable */}
                <div className="overflow-x-auto pb-4">
                  <div className="flex gap-6 min-w-[1200px]">
                    <div className="flex-1 min-w-[600px]">
                      <MapView selectedFloat={selectedFloat} setSelectedFloat={setSelectedFloat} />
                    </div>
                    <div className="flex-1 min-w-[600px]">
                      <ProfileView selectedFloat={selectedFloat} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'map' && (
              <div className="overflow-x-auto pb-4">
                <div className="min-w-[700px]">
                  <MapView selectedFloat={selectedFloat} setSelectedFloat={setSelectedFloat} />
                </div>
              </div>
            )}

            {activeSection === 'profiles' && (
              <div className="overflow-x-auto pb-4">
                <div className="min-w-[700px]">
                  <ProfileView selectedFloat={selectedFloat} />
                </div>
              </div>
            )}

            {/* Full chat section */}
    {activeSection === 'chat' && (
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[500px] h-[600px]">   {/* ⬅️ increased height */}
          <ChatPanel
            messages={chatMessages}
            setMessages={setChatMessages}
            selectedFloat={selectedFloat}
          />
        </div>
      </div>
    )}
          </div>

          {/* Sidebar (Chat only, isolated card) */}
          <div className="xl:col-span-1 space-y-6">
            {activeSection !== 'chat' && (
              <div className="overflow-x-auto">
                <div className="min-w-[350px]">
                  <ChatPanel
                    messages={chatMessages.slice(-3)}
                    setMessages={setChatMessages}
                    selectedFloat={selectedFloat}
                    compact={true}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
