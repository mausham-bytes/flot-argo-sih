import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Brain, Waves } from 'lucide-react';
import { argoApi, ArgoFloat } from '../services/argoApi';

interface Message {
  id: number;
  sender: 'user' | 'nerida';
  message: string;
  timestamp: Date;
  data?: any;
}

interface ChatPanelProps {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  selectedFloat: ArgoFloat | null;
  compact?: boolean;
  onFloatSelect?: (float: ArgoFloat) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ 
  messages, 
  setMessages, 
  selectedFloat, 
  compact = false,
  onFloatSelect
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      sender: 'user',
      message: inputMessage,
      timestamp: new Date()
    };

    setMessages([...messages, newMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const data = await argoApi.chatQuery(inputMessage);

      const neridaResponse: Message = {
        id: messages.length + 2,
        sender: 'nerida',
        message: data.text,
        timestamp: new Date(),
        data: data.data
      };

      setMessages([...messages, newMessage, neridaResponse]);
      
      // If the response includes float data, you could trigger float selection
      if (data.floats && data.floats.length > 0 && onFloatSelect) {
        onFloatSelect(data.floats[0]);
      }
    } catch (error: unknown) {
      let errorMessageText = 'Unknown error';
      if (error instanceof Error) {
        errorMessageText = error.message;
      }
      const errorMessage: Message = {
        id: messages.length + 2,
        sender: 'nerida',
        message: `I'm having trouble connecting to the data services right now. Let me help you with what I know about ARGO floats! Try asking about ocean temperature, salinity, or float locations.`,
        timestamp: new Date(),
      };
      setMessages([...messages, newMessage, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (message: Message) => {
    if (message.data?.type === 'temperature_summary') {
      return (
        <div>
          <p className="mb-2">{message.message}</p>
          <div className="bg-slate-600/30 p-2 rounded text-xs">
            <div className="flex justify-between">
              <span>Surface Temp:</span>
              <span className="text-red-400">16.8°C avg</span>
            </div>
          </div>
        </div>
      );
    }
    return <p className="text-sm">{message.message}</p>;
  };
  return (
    <div className={`bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden ${
      compact ? 'h-80' : 'h-96'
    }`}>
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <MessageCircle className="w-5 h-5 text-cyan-400" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h3 className="font-semibold">Chat with Nerida</h3>
            {compact && (
              <p className="text-xs text-slate-400">AI Oceanographer Assistant</p>
            )}
            {selectedFloat && (
              <p className="text-xs text-cyan-400">Analyzing: {selectedFloat.id}</p>
            )}
          </div>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${compact ? 'h-48' : 'h-64'}`}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="flex items-start space-x-2 max-w-xs">
              {message.sender === 'nerida' && (
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Waves className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`p-3 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-cyan-500 text-slate-900'
                    : 'bg-slate-700 text-white'
                }`}
              >
                {formatMessage(message)}
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                <Brain className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div className="bg-slate-700 p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-700/50">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={selectedFloat ? `Ask about ${selectedFloat.id}...` : "Ask Nerida about ocean data..."}
            className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="p-2 bg-cyan-500 text-slate-900 rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};