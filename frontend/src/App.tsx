import { Button } from '@/components/ui/button.tsx';
import { MessageCircle, Send, Users } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import './App.css';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
}

const App: React.FC = () => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [userCount, setUserCount] = useState<number>(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateRoomId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const connectWebSocket = () => {
    const websocket = new WebSocket('ws://localhost:8080');

    websocket.onopen = () => {
      console.log('Connected to WebSocket');
      // Join room after connection
      websocket.send(
        JSON.stringify({
          type: 'join',
          payload: { roomId },
        })
      );
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);

        if (data.type === 'chat') {
          const newMsg: Message = {
            id: `${Date.now()}-${Math.random()}`, // More unique ID
            text: data.message,
            sender: 'other', // This is always from others now since server excludes sender
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };
          setMessages((prev) => [...prev, newMsg]);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket connection closed');
      setWs(null);
      setIsJoined(false);
    };
  };

  const joinRoom = () => {
    if (!roomId.trim()) return;

    connectWebSocket();
    setIsJoined(true);
    setUserCount(2); // Mock user count for demo
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !ws) return;

    // Send to WebSocket
    ws.send(
      JSON.stringify({
        type: 'chat',
        payload: {
          message: newMessage,
        },
      })
    );

    // Add to local messages
    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const leaveRoom = () => {
    if (ws) {
      ws.close();
    }
    setIsJoined(false);
    setMessages([]);
    setRoomId('');
  };

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-2xl font-bold">
              <MessageCircle size={32} />
              <h1>Real Time Chat</h1>
            </div>
            <p className="text-gray-400 text-sm">
              temporary room that expires after both users exit
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Enter Room Code:
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="Enter room code..."
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                maxLength={6}
              />
            </div>

            <Button
              onClick={joinRoom}
              disabled={!roomId.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed py-3"
            >
              Join Room
            </Button>

            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">or</p>
              <Button
                onClick={() => setRoomId(generateRoomId())}
                variant="outline"
                className="w-full border-gray-600 text-white hover:bg-gray-800"
              >
                Generate New Room
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle size={24} />
            <div>
              <h2 className="font-semibold">Real Time Chat</h2>
              <p className="text-sm text-gray-400">Room Code: {roomId}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users size={16} />
              <span>Users: {userCount}/2</span>
            </div>
            <Button onClick={leaveRoom} variant="destructive" size="sm">
              Leave
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'me' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.sender === 'me'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-gray-700 text-white rounded-bl-md'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.sender === 'me' ? 'text-blue-200' : 'text-gray-400'
                  }`}
                >
                  {message.timestamp}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-gray-900 border-t border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default App;
