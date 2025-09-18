

// import React, { useState, useRef, useEffect } from 'react';
// import { Send, MessageCircle, Brain, Waves } from 'lucide-react';
// import ReactMarkdown from 'react-markdown';  // new

// interface Message {
//   id: number;
//   sender: 'user' | 'nerida';
//   message: string;
//   timestamp: Date;
// }

// interface ChatPanelProps {
//   messages: Message[];
//   setMessages: (messages: Message[]) => void;
//   selectedFloat: any;
//   compact?: boolean;
// }

// export const ChatPanel: React.FC<ChatPanelProps> = ({ 
//   messages, 
//   setMessages, 
//   selectedFloat, 
//   compact = false 
// }) => {
//   const [inputMessage, setInputMessage] = useState('');
//   const [isTyping, setIsTyping] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   const handleSendMessage = async () => {
//     if (!inputMessage.trim()) return;

//     const newMessage: Message = {
//       id: messages.length + 1,
//       sender: 'user',
//       message: inputMessage,
//       timestamp: new Date()
//     };

//     setMessages([...messages, newMessage]);
//     setInputMessage('');
//     setIsTyping(true);

//     try {
//       const response = await fetch('/chat/query', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ query: inputMessage }),
//       });

//       if (!response.ok) throw new Error(`Server error: ${response.statusText}`);

//       const data = await response.json();

//       const neridaResponse: Message = {
//         id: messages.length + 2,
//         sender: 'nerida',
//         message: formatAIResponse(data.text || 'No response from server'),
//         timestamp: new Date(),
//       };

//       setMessages([...messages, newMessage, neridaResponse]);
//     } catch (error: unknown) {
//       let errorMessageText = 'Unknown error';
//       if (error instanceof Error) errorMessageText = error.message;
//       const errorMessage: Message = {
//         id: messages.length + 2,
//         sender: 'nerida',
//         message: `**Error:** ${errorMessageText}`,
//         timestamp: new Date(),
//       };
//       setMessages([...messages, newMessage, errorMessage]);
//     } finally {
//       setIsTyping(false);
//     }
//   };

//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSendMessage();
//     }
//   };

//   // Format AI response with bullets, bold, etc.
//   const formatAIResponse = (text: string) => {
//     // Example: split by sentences, add bullets
//     const lines = text.split('. ').map((line) => `- ${line.trim()}`);
//     return lines.join('\n');
//   };

//   return (
//     <div className={`bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden ${
//       compact ? 'h-80' : 'h-96'
//     }`}>
//       <div className="p-4 border-b border-slate-700/50">
//         <div className="flex items-center space-x-3">
//           <div className="relative">
//             <MessageCircle className="w-5 h-5 text-cyan-400" />
//             <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
//           </div>
//           <div>
//             <h3 className="font-semibold">Chat with Nerida</h3>
//             {compact && (
//               <p className="text-xs text-slate-400">AI Oceanographer Assistant</p>
//             )}
//           </div>
//         </div>
//       </div>

//       <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${compact ? 'h-48' : 'h-64'}`}>
//         {messages.map((message) => (
//           <div
//             key={message.id}
//             className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
//           >
//             <div className="flex items-start space-x-2 max-w-xs">
//               {message.sender === 'nerida' && (
//                 <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
//                   <Waves className="w-4 h-4 text-white" />
//                 </div>
//               )}
//               <div
//                 className={`p-3 rounded-lg ${message.sender === 'user'
//                   ? 'bg-cyan-500 text-slate-900'
//                   : 'bg-slate-700 text-white'
//                 }`}
//               >
//                 {/* Use react-markdown to render formatted text */}
//                <div className="prose prose-sm text-white">
//   <ReactMarkdown>
//     {message.message}
//   </ReactMarkdown>
// </div>

//                 <p className="text-xs opacity-70 mt-1">
//                   {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                 </p>
//               </div>
//             </div>
//           </div>
//         ))}

//         {isTyping && (
//           <div className="flex justify-start">
//             <div className="flex items-start space-x-2">
//               <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
//                 <Brain className="w-4 h-4 text-white animate-pulse" />
//               </div>
//               <div className="bg-slate-700 p-3 rounded-lg">
//                 <div className="flex space-x-1">
//                   <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
//                   <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
//                   <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//         <div ref={messagesEndRef} />
//       </div>

//       <div className="p-4 border-t border-slate-700/50">
//         <div className="flex space-x-2">
//           <input
//             type="text"
//             value={inputMessage}
//             onChange={(e) => setInputMessage(e.target.value)}
//             onKeyPress={handleKeyPress}
//             placeholder="Ask Nerida about ocean data..."
//             className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
//           />
//           <button
//             onClick={handleSendMessage}
//             disabled={!inputMessage.trim() || isTyping}
//             className="p-2 bg-cyan-500 text-slate-900 rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             <Send className="w-4 h-4" />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };


import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Brain, Waves } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: number;
  sender: 'user' | 'nerida';
  message: string;
  timestamp: Date;
}

interface ChatPanelProps {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  selectedFloat: any;
  compact?: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  setMessages,
  selectedFloat,
  compact = false,
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

  // Parse AI response into numbers/key-values and description
  const parseAIMessage = (text: string) => {
    const lines = text.split('\n').filter(Boolean);
    const keyValues: { key: string; value: string }[] = [];
    const descriptionLines: string[] = [];

    lines.forEach((line) => {
      const match = line.match(/^([a-zA-Z\s]+):\s*([\d.-]+)/); // matches key: number
      if (match) {
        keyValues.push({ key: match[1].trim(), value: match[2].trim() });
      } else {
        descriptionLines.push(line);
      }
    });

    return { keyValues, description: descriptionLines.join('\n') };
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      sender: 'user',
      message: inputMessage,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: inputMessage }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
      const data = await response.json();

      const neridaResponse: Message = {
        id: messages.length + 2,
        sender: 'nerida',
        message: data.text || 'No response from server',
        timestamp: new Date(),
      };

      setMessages([...messages, newMessage, neridaResponse]);
    } catch (error: unknown) {
      let errorMessageText = 'Unknown error';
      if (error instanceof Error) errorMessageText = error.message;

      const errorMessage: Message = {
        id: messages.length + 2,
        sender: 'nerida',
        message: `Error: ${errorMessageText}`,
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

  return (
    <div
      className={`bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden ${
        compact ? 'h-80' : 'h-96'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <MessageCircle className="w-5 h-5 text-cyan-400" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h3 className="font-semibold">Chat with Nerida</h3>
            {compact && <p className="text-xs text-slate-400">AI Oceanographer Assistant</p>}
          </div>
        </div>
      </div>

      {/* Messages */}
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
                {message.sender === 'nerida' ? (
                  <div className="space-y-2">
                    {(() => {
                      const { keyValues, description } = parseAIMessage(message.message);
                      return (
                        <>
                          {/* Display numbers / coordinates first */}
                          {keyValues.map((item, idx) => (
                            <div key={idx}>
                              <span className="font-bold text-cyan-400">{item.key}:</span>{' '}
                              <span className="font-semibold text-white">{item.value}</span>
                            </div>
                          ))}

                          {/* Description */}
                          {description && (
                            <div className="mt-2 p-2 bg-slate-700 rounded-md">
                              <span className="font-bold text-yellow-300">Description:</span>
                              <div className="ml-2 text-white">
                                 <ReactMarkdown >
                                {description}
                              </ReactMarkdown>

                              </div>
                             
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-sm">{message.message}</p>
                )}

                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                <Brain className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div className="bg-slate-700 p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Nerida about ocean data..."
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

