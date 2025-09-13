import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MapView } from './components/MapView';
import { ProfileView } from './components/ProfileView';
import { SummaryCards } from './components/SummaryCards';
import { ChatPanel } from './components/ChatPanel';
import { ExportPanel } from './components/ExportPanel';
import { FloatingElements } from './components/FloatingElements';

function App() {
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedFloat, setSelectedFloat] = useState(null);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'nerida',
      message: "Hello! I'm Nerida, your friendly AI oceanographer. I'm here to help you explore ARGO float data. What would you like to discover about our oceans today?",
      timestamp: new Date()
    }
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white overflow-hidden relative">
      <FloatingElements />
      
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6 relative z-10">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'overview', label: '🌊 Overview', icon: '🌊' },
            { id: 'map', label: '🌐 Map View', icon: '🌐' },
            { id: 'profiles', label: '📊 Profiles', icon: '📊' },
            { id: 'chat', label: '💬 Chat with Nerida', icon: '💬' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
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
                <SummaryCards />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <MapView selectedFloat={selectedFloat} setSelectedFloat={setSelectedFloat} />
                  <ProfileView selectedFloat={selectedFloat} />
                </div>
              </div>
            )}
            
            {activeSection === 'map' && (
              <MapView selectedFloat={selectedFloat} setSelectedFloat={setSelectedFloat} />
            )}
            
            {activeSection === 'profiles' && (
              <ProfileView selectedFloat={selectedFloat} />
            )}
            
            {activeSection === 'chat' && (
              <ChatPanel 
                messages={chatMessages} 
                setMessages={setChatMessages}
                selectedFloat={selectedFloat}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {activeSection !== 'chat' && (
              <ChatPanel 
                messages={chatMessages.slice(-3)} 
                setMessages={setChatMessages}
                selectedFloat={selectedFloat}
                compact={true}
              />
            )}
            <ExportPanel selectedFloat={selectedFloat} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;