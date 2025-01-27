"use client";
import { useState } from 'react';

export function ProviderChat() {
  const [messages, setMessages] = useState<Array<{sender: string, text: string}>>([]);
  const [newMessage, setNewMessage] = useState('');

  const sendMessage = () => {
    if (newMessage.trim()) {
      setMessages([...messages, { sender: 'user', text: newMessage }]);
      // Add API call to backend
      setNewMessage('');
    }
  };

  return (
    <div className="bg-ds-dark/50 p-4 rounded-lg border border-ds-primary/20 h-96 flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`p-3 rounded ${msg.sender === 'user' 
            ? 'bg-ds-primary/10 ml-auto' 
            : 'bg-ds-dark'}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 bg-ds-dark border border-ds-primary/20 rounded px-4 py-2"
          placeholder="Type your message..."
        />
        <button 
          onClick={sendMessage}
          className="bg-ds-primary text-ds-dark px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}