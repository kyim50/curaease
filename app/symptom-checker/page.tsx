'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import OpenAI from "openai";
import { v4 as uuidv4 } from 'uuid';
import { 
  Menu, 
  Search, 
  Plus, 
  Send, 
  Loader2, 
  Trash2, 
  MessageCircle,
  Image,
  FileText,
  Sparkles,
  HelpCircle,
  Settings,
  MoreHorizontal,
  Mic
} from 'lucide-react';
import Nav from '../components/nav';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: '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',
  dangerouslyAllowBrowser: true,
  defaultHeaders: {
    "HTTP-Referer": 'http://localhost:3000',
    "X-Title": "Medical Symptom Checker",
  }
});

const MEDICAL_SYSTEM_PROMPT = `You are a professional medical AI assistant. Follow these rules strictly:
1. Ask one focused medical question at a time to gather necessary information
2. Structure questions in logical sequence: onset → characteristics → associated symptoms → severity
3. Consider differential diagnoses with ICD-10 codes (include 3-5 possibilities)
4. Recommend OTC medications (e.g., ibuprofen, loperamide, antacids) with dosage guidelines when appropriate
5. Always clarify: "When did this start?" "Has this happened before?" "What makes it better/worse?"
6. Use only English and maintain professional tone
7. For serious symptoms (chest pain, difficulty breathing), advise immediate emergency care
8. Explain medical terms in simple language between parentheses
9. End with "Preliminary Assessment:" when sufficient data is collected`;

const retry = async (fn: () => Promise<any>, maxAttempts = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

export default function SymptomChecker() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [definitions, setDefinitions] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load conversations from localStorage on mount
  useEffect(() => {
    const savedConvs = localStorage.getItem('med-conversations');
    if (savedConvs) {
      const parsedConvs = JSON.parse(savedConvs);
      setConversations(parsedConvs);
      if (parsedConvs.length > 0 && !currentConversationId) {
        setCurrentConversationId(parsedConvs[0].id);
      }
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('med-conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  // Auto scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations]);

  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const messages = currentConversation?.messages || [];

  const createNewConversation = () => {
    const newConv: Conversation = {
      id: uuidv4(),
      title: 'New chat',
      messages: [],
      createdAt: Date.now()
    };
    setConversations(prev => [newConv, ...prev]);
    setCurrentConversationId(newConv.id);
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(conversations[1]?.id || null);
    }
    toast.success('Chat deleted');
  };

  const validateInput = (input: string): boolean => {
    if (!input.trim()) return false;
    if (input.length < 3 || input.length > 500) return false;
    return true;
  };

  const extractDefinitions = (response: string) => {
    const termRegex = /\(([^)]+)\)/g;
    return [...new Set(Array.from(response.matchAll(termRegex), m => m[1]))];
  };

  // Quick action: pre-fill the input with a prompt and auto-submit after a brief delay.
  const handleQuickAction = (prompt: string) => {
    setUserInput(prompt);
    setTimeout(() => handleSubmit(), 100);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Create a new conversation if none exists.
    if (!currentConversationId) {
      createNewConversation();
    }

    if (!validateInput(userInput)) {
      setError('Please enter a valid description (3-500 characters)');
      return;
    }

    setIsLoading(true);
    setError('');

    const updatedMessages = [
      ...messages, 
      { role: 'user', content: userInput, timestamp: Date.now() }
    ];

    // Update current conversation with the new user message.
    setConversations(prev => prev.map(conv => 
      conv.id === currentConversationId
        ? { ...conv, messages: updatedMessages }
        : conv
    ));

    try {
      const getChatResponse = async () => {
        const models = [
          "google/gemini-2.0-flash-thinking-exp:free",
          "anthropic/claude-3-haiku:free",
          "google/gemini-pro:free"
        ];

        for (const model of models) {
          try {
            const completion = await openai.chat.completions.create({
              model,
              messages: [
                { role: 'system', content: MEDICAL_SYSTEM_PROMPT },
                ...updatedMessages.map(msg => ({
                  role: msg.role,
                  content: msg.content
                }))
              ],
              temperature: 0.3,
              max_tokens: 1000,
            });

            if (completion?.choices?.[0]?.message?.content) {
              return completion.choices[0].message.content;
            }
          } catch (modelError) {
            console.error(`Error with model ${model}:`, modelError);
            continue;
          }
        }
        throw new Error('All models failed to respond');
      };

      const assistantResponse = await retry(getChatResponse);
      
      if (!assistantResponse) {
        throw new Error('No valid response received from any AI model');
      }

      // Clean up the assistant response.
      const cleanedResponse = assistantResponse
        .replace(/[^\w\s.,!?()-]/g, '')
        .replace(/\n+/g, '\n');

      const newMessages = [
        ...updatedMessages,
        { role: 'assistant', content: cleanedResponse, timestamp: Date.now() }
      ];

      setConversations(prev => prev.map(conv => 
        conv.id === currentConversationId
          ? { 
              ...conv, 
              messages: newMessages, 
              title: conv.messages.length === 0 ? userInput.substring(0, 50) : conv.title 
            }
          : conv
      ));

      setDefinitions(extractDefinitions(cleanedResponse));

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get response from AI service';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Roll back the conversation messages on error.
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversationId
          ? { ...conv, messages: messages }
          : conv
      ));
    } finally {
      setUserInput('');
      setIsLoading(false);
    }
  };

  // Quick–action options used in the empty–state view.
  const quickActions = [
    { 
      icon: <Image className="w-6 h-6" />, 
      text: "Describe your symptoms",
      prompt: "I'm experiencing the following symptoms: [describe your symptoms]" 
    },
    { 
      icon: <FileText className="w-6 h-6" />, 
      text: "Get medical advice",
      prompt: "Please provide medical advice for:" 
    },
    { 
      icon: <Sparkles className="w-6 h-6" />, 
      text: "Learn about conditions",
      prompt: "Explain the condition of [condition name]" 
    },
    { 
      icon: <HelpCircle className="w-6 h-6" />, 
      text: "Ask health questions",
      prompt: "Can you tell me about..." 
    }
  ];

  return (
    <div>
      <Nav /> {/* Add the Nav component here */}
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-[#202123] overflow-hidden`}>
        <div className="flex flex-col h-full">
          {/* New Chat Button */}
          <div className="p-4">
            <button 
              onClick={createNewConversation}
              className="flex items-center gap-3 w-full rounded-md border border-white/20 px-3 py-2 text-white hover:bg-gray-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New chat
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {conversations.map(conv => (
              <div
                key={conv.id}
                className={`group relative mx-2 my-1 rounded-lg cursor-pointer transition-colors ${
                  currentConversationId === conv.id 
                    ? 'bg-[#343541]' 
                    : 'hover:bg-[#2A2B32]'
                }`}
              >
                <div 
                  onClick={() => setCurrentConversationId(conv.id)}
                  className="flex items-center gap-3 p-3 text-gray-300"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="truncate text-sm">
                    {conv.title || 'New chat'}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 
                    opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Bottom Section */}
          <div className="border-t border-white/20 p-4">
            <button className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-gray-300 hover:bg-gray-700 transition-colors">
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-[#343541]">
        {/* Header */}
        <div className="flex items-center p-4 border-b border-white/20">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-300 hover:bg-gray-700 rounded-md"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="ml-4 text-white font-semibold">Medical Assistant</h1>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white">
              <h2 className="text-3xl font-bold mb-8">How can I help you?</h2>
              <div className="grid grid-cols-2 gap-4 max-w-2xl px-4">
                {quickActions.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(item.prompt)}
                    className="p-4 rounded-lg border border-white/20 hover:bg-gray-700 transition-colors cursor-pointer flex flex-col items-center gap-2"
                  >
                    {item.icon}
                    <span className="text-sm">{item.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-4 px-6">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`py-6 ${msg.role === 'assistant' ? 'bg-[#444654]' : ''}`}
                >
                  <div className="max-w-3xl mx-auto flex gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      msg.role === 'user' ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                      {msg.role === 'user' ? 'U' : 'A'}
                    </div>
                    <div className="flex-1 text-gray-100 whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-white/20 bg-[#343541] p-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <div className="relative flex items-center">
                <input
                  value={userInput}
                  onChange={(e) => {
                    setUserInput(e.target.value);
                    setError('');
                  }}
                  placeholder="Message Medical Assistant..."
                  className="w-full bg-[#40414F] text-white rounded-lg pl-4 pr-12 py-3 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/20"
                  disabled={isLoading}
                />
                <div className="absolute right-2 flex items-center gap-2">
                  {!isLoading && (
                    <button
                      type="button"
                      className="p-1 text-gray-400 hover:text-gray-100 transition-colors"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="p-1 text-gray-400 hover:text-gray-100 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {error && (
                  <div className="absolute bottom-full left-0 w-full mb-2 px-2">
                    <div className="text-red-400 text-sm bg-[#40414F] p-2 rounded-lg border border-red-400">
                      {error}
                    </div>
                  </div>
                )}
              </div>
            </form>

            {/* Bottom Text */}
            <div className="text-xs text-center mt-2 text-gray-400">
              Medical AI Assistant can make mistakes. Consider verifying important information.
            </div>

            {/* Quick Actions Row (Optional additional actions) */}
            <div className="flex justify-center gap-2 mt-4">
              {['Create image', 'Summarize text', 'Surprise me', 'Get advice', 'More'].map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickAction(action)}
                  className="px-3 py-1.5 bg-[#40414F] text-gray-300 text-sm rounded-full 
                    border border-white/20 hover:bg-[#4A4B55] transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>

            {/* Medical Terms Box */}
            {definitions.length > 0 && (
              <div className="mt-4 bg-[#40414F] rounded-lg p-4 border border-white/20">
                <h3 className="text-blue-400 font-semibold mb-2">Medical Terms</h3>
                <ul className="space-y-1">
                  {definitions.map((def, i) => (
                    <li key={i} className="text-sm text-gray-300">• {def}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Modal - can be implemented later */}
      {/* <div className="hidden fixed inset-0 bg-black/50 flex items-start justify-center pt-20">
        <div className="bg-[#202123] w-full max-w-2xl rounded-lg shadow-lg">
          <div className="p-4">
            <div className="flex items-center gap-2 bg-[#40414F] rounded-lg px-3 py-2">
              <Search className="w-5 h-5 text-gray-400" />
              <input 
                className="bg-transparent text-white placeholder-gray-400 flex-1 focus:outline-none"
                placeholder="Search messages..."
              />
            </div>
          </div>
        </div>
      </div> */}
    </div>
    </div>
  );
}
