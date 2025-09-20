import React, { useState } from 'react';
import { Header } from './components/Header';
import { MapView } from './components/MapView';
import { ProfileView } from './components/ProfileView';
import { SummaryCards } from './components/SummaryCards';
import { ChatPanel } from './components/ChatPanel';
import { FloatingElements } from './components/FloatingElements';
import { ArgoFloat } from './services/argoApi';

function App() {
  const [activeSection, setActiveSection] = useState<'overview' | 'map' | 'profiles' | 'chat'>('overview');
  const [selectedFloat, setSelectedFloat] = useState<ArgoFloat | null>(null);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'nerida',
      message:
        "Hello! I'm Nerida, your AI oceanographer assistant. I can help you explore ARGO float data, analyze ocean conditions, and answer questions about temperature, salinity, and oxygen levels. What would you like to discover about our oceans today?",
      timestamp: new Date(),
    },
  ]);

  const handleFloatSelect = (float: ArgoFloat | null) => {
    setSelectedFloat(float);
    if (float && activeSection === 'overview') {
      // Auto-switch to profiles when a float is selected from overview
      setActiveSection('profiles');
    }
  };
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

        {/* Selected Float Info */}
        {selectedFloat && (
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-lg border border-slate-700/50 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${
                  selectedFloat.status === 'active' ? 'bg-emerald-400' : 'bg-orange-400'
                } animate-pulse`} />
                <div>
                  <h3 className="font-semibold text-cyan-400">{selectedFloat.id}</h3>
                  <p className="text-sm text-slate-300">
                    {selectedFloat.lat.toFixed(2)}°, {selectedFloat.lon.toFixed(2)}° • 
                    Cycle #{selectedFloat.cycle_number} • {selectedFloat.platform_type}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFloat(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}
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
                      <MapView selectedFloat={selectedFloat} setSelectedFloat={handleFloatSelect} />
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
                  <MapView selectedFloat={selectedFloat} setSelectedFloat={handleFloatSelect} />
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
            onFloatSelect={handleFloatSelect}
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
                    onFloatSelect={handleFloatSelect}
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
