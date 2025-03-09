'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
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
  Mic,
  Calendar,
  X,
  ArrowLeft,
  Clock
} from 'lucide-react';
import { LandingNav } from '../components/LandingNav';
import { KernelMemoryClient } from './kernel-memory-client';

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

// Initialize client keys
const OPENROUTER_API_KEY='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';
// Initialize Kernel Memory client
const kernelMemory = new KernelMemoryClient();

const MEDICAL_SYSTEM_PROMPT = `You are a professional medical AI assistant. Follow these rules strictly:
1. Ask one focused medical question at a time to gather necessary information
2. Structure questions in logical sequence: onset → characteristics → associated symptoms → severity
3. Consider differential diagnoses with ICD-10 codes (include 3-5 possibilities)
4. Recommend OTC medications (e.g., ibuprofen, loperamide, antacids) with dosage guidelines when appropriate
5. Always clarify: "When did this start?" "Has this happened before?" "What makes it better/worse?"
6. Use only English and maintain professional tone
7. For serious symptoms (chest pain, difficulty breathing), advise immediate emergency care
8. Explain medical terms in simple language between parentheses
9. End with "Preliminary Assessment:" when sufficient data is collected
10. Use the RAG context provided to inform your responses with real medical knowledge from doctor-patient conversations`;

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

// Format date as "Mar 8, 2025"
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

// Format time as "2:30 PM"
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

export default function SymptomChecker() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [definitions, setDefinitions] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMemoryLoaded, setIsMemoryLoaded] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [searchDate, setSearchDate] = useState<Date | null>(null);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResponseAnimating, setIsResponseAnimating] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Load datasets into Kernel Memory on first render
  useEffect(() => {
    const loadDatasets = async () => {
      try {
        // Check if memory is already loaded
        if (!isMemoryLoaded) {
          setIsLoading(true);
          toast.loading('Loading medical knowledge base...', { duration: 3000 });
          
          // This will index your JSON files into Kernel Memory
          await kernelMemory.loadMedicalDataset('./en_medical_dialog.json');
          
          setIsMemoryLoaded(true);
          toast.success('Medical knowledge base loaded successfully');
        }
      } catch (err) {
        console.error('Failed to load datasets:', err);
        toast.error('Failed to load medical knowledge base');
      } finally {
        setIsLoading(false);
      }
    };

    loadDatasets();
  }, []);

  // Load conversations from localStorage on mount
  useEffect(() => {
    const savedConvs = localStorage.getItem('med-conversations');
    if (savedConvs) {
      const parsedConvs = JSON.parse(savedConvs);
      setConversations(parsedConvs);
      setFilteredConversations(parsedConvs);
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
  }, [conversations, isResponseAnimating]);

  // Close calendar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filterConversationsByDate = (date: Date | null) => {
    if (!date) {
      setFilteredConversations(conversations);
      setIsSearching(false);
      return;
    }
    
    // Set hours to 0 to match full day
    const searchDay = new Date(date);
    searchDay.setHours(0, 0, 0, 0);
    const nextDay = new Date(searchDay);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const filtered = conversations.filter(conv => {
      const convDate = new Date(conv.createdAt);
      return convDate >= searchDay && convDate < nextDay;
    });
    
    setFilteredConversations(filtered);
    setIsSearching(true);
  };

  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const messages = currentConversation?.messages || [];

  const createNewConversation = () => {
    const newConv: Conversation = {
      id: uuidv4(),
      title: formatDate(Date.now()),
      messages: [],
      createdAt: Date.now()
    };
    setConversations(prev => [newConv, ...prev]);
    setFilteredConversations(prev => [newConv, ...prev]);
    setCurrentConversationId(newConv.id);
    setIsSearching(false);
    setSearchDate(null);
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => {
      const newConvs = prev.filter(conv => conv.id !== id);
      setFilteredConversations(newConvs);
      return newConvs;
    });
    
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

  // Call OpenRouter API
  const callOpenRouter = async (messages: any[]) => {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-4-turbo",  // Adjust for best reasoning performance
          messages: messages,
          temperature: 0.3,  // Controls randomness
          max_tokens: 1000,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to get response from OpenRouter");
      }
  
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("Error calling OpenRouter:", error);
      return "I'm currently unable to fetch responses due to an API issue.";
    }
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
      // Perform RAG to get relevant context from patient-doctor conversations
      const ragContext = await kernelMemory.searchMedicalKnowledge(userInput);
      
      const getChatResponse = async () => {
        try {
          // Prepare messages array for model
          const apiMessages = [
            { 
              role: 'system', 
              content: `${MEDICAL_SYSTEM_PROMPT}\n\nHere is relevant context from real doctor-patient conversations:\n${ragContext}` 
            },
            ...updatedMessages.map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          ];

          return await callOpenRouter(apiMessages);
        } catch (modelError) {
          console.error(`Error with API:`, modelError);
          throw modelError;
        }
      };

      // Start response animation before getting the real response
      setIsResponseAnimating(true);

      const assistantResponse = await retry(() => getChatResponse());
      
      if (!assistantResponse) {
        throw new Error('No valid response received from API');
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
              title: conv.messages.length === 0 ? userInput.substring(0, 30) + '...' : conv.title 
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
      // Stop response animation after a short delay to ensure smooth transition
      setTimeout(() => {
        setIsResponseAnimating(false);
      }, 500);
    }
  };

  // Quick–action options used in the empty–state view.
  const quickActions = [
    { 
      icon: <Image className="w-6 h-6 text-[#00A676]" />, 
      text: "Describe your symptoms",
      prompt: "I'm experiencing the following symptoms: [describe your symptoms]" 
    },
    { 
      icon: <FileText className="w-6 h-6 text-[#00A676]" />, 
      text: "Get medical advice",
      prompt: "Please provide medical advice for:" 
    },
    { 
      icon: <Sparkles className="w-6 h-6 text-[#00A676]" />, 
      text: "Learn about conditions",
      prompt: "Explain the condition of [condition name]" 
    },
    { 
      icon: <HelpCircle className="w-6 h-6 text-[#00A676]" />, 
      text: "Ask health questions",
      prompt: "Can you tell me about..." 
    }
  ];

  // Mini-calendar component for date selection
  const MiniCalendar = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const days = [];
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
      }
      return days;
    };
    
    const getDayOfWeek = (date: Date) => {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days[date.getDay()];
    };
    
    const isCurrentDay = (date: Date) => {
      const today = new Date();
      return date.getDate() === today.getDate() && 
             date.getMonth() === today.getMonth() && 
             date.getFullYear() === today.getFullYear();
    };
    
    const isSelectedDay = (date: Date) => {
      return searchDate !== null && 
             date.getDate() === searchDate.getDate() && 
             date.getMonth() === searchDate.getMonth() && 
             date.getFullYear() === searchDate.getFullYear();
    };
    
    const handlePrevMonth = () => {
      const prevMonth = new Date(currentMonth);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      setCurrentMonth(prevMonth);
    };
    
    const handleNextMonth = () => {
      const nextMonth = new Date(currentMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setCurrentMonth(nextMonth);
    };
    
    const handleSelectDay = (date: Date) => {
      setSearchDate(date);
      filterConversationsByDate(date);
      setIsCalendarOpen(false);
    };
    
    // Add month selection dropdown
    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newMonth = new Date(currentMonth);
      newMonth.setMonth(parseInt(e.target.value));
      setCurrentMonth(newMonth);
    };
  
    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newYear = new Date(currentMonth);
      newYear.setFullYear(parseInt(e.target.value));
      setCurrentMonth(newYear);
    };
    
    const daysInMonth = getDaysInMonth(currentMonth);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Generate year options (from current year - 5 to current year + 5)
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
    
    return (
      <div className="bg-white rounded-lg shadow-lg p-3 w-72">
        <div className="flex justify-between items-center mb-2">
          <button 
            onClick={handlePrevMonth}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          {/* Replace static month display with dropdowns */}
          <div className="flex items-center space-x-1">
            <select 
              value={currentMonth.getMonth()} 
              onChange={handleMonthChange}
              className="text-sm border-0 bg-transparent font-medium cursor-pointer outline-none"
            >
              {months.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>
            
            <select 
              value={currentMonth.getFullYear()} 
              onChange={handleYearChange}
              className="text-sm border-0 bg-transparent font-medium cursor-pointer outline-none"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={handleNextMonth}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 transform rotate-180" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day}>{day}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before the first of the month */}
          {Array(daysInMonth[0].getDay()).fill(null).map((_, index) => (
            <div key={`empty-${index}`} className="h-7"></div>
          ))}
          
          {daysInMonth.map(date => (
            <button
              key={date.toString()}
              onClick={() => handleSelectDay(date)}
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs transition-colors ${
                isCurrentDay(date) 
                  ? 'bg-[#00A676] text-white' 
                  : isSelectedDay(date)
                  ? 'bg-[#e6f7f1] text-[#00A676] border border-[#00A676]'
                  : 'hover:bg-gray-100 text-gray-700'  // Add explicit text color
              }`}
            >
              {date.getDate()}
            </button>
          ))}
        </div>
        
        <div className="mt-2 pt-2 border-t flex justify-between">
          <button
            onClick={() => {
              setSearchDate(null);
              filterConversationsByDate(null);
              setIsCalendarOpen(false);
            }}
            className="text-xs text-[#00A676] hover:underline"
          >
            Clear
          </button>
          <button
            onClick={() => setIsCalendarOpen(false)}
            className="text-xs text-gray-500 hover:underline"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <LandingNav />
      <div className="flex flex-1 bg-white">
        {/* Sidebar */}
        <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-white border-r overflow-hidden`}>
          <div className="flex flex-col h-full">
            {/* New Chat Button */}
            <div className="p-4">
              <button 
                onClick={createNewConversation}
                className="flex items-center gap-3 w-full rounded-md bg-[#00A676] px-3 py-2 text-white hover:bg-[#008c63] transition-colors"
              >
                <Plus className="w-4 h-4" />
                New chat
              </button>
            </div>

            {/* Search/Calendar Input */}
            <div className="px-4 pb-2 relative">
              <div className="relative">
                <button
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-gray-300 text-sm text-gray-700 hover:border-[#00A676] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    {searchDate 
                      ? formatDate(searchDate.getTime())
                      : 'Search by date'}
                  </div>
                  {searchDate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchDate(null);
                        filterConversationsByDate(null);
                      }}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <X className="w-3 h-3 text-gray-500" />
                    </button>
                  )}
                </button>
                
                {isCalendarOpen && (
                  <div 
                    ref={calendarRef}
                    className="absolute z-50 mt-1 left-0"
                    style={{
                      position: 'fixed',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                      borderRadius: '8px'
                    }}
                  >
                    <MiniCalendar />
                  </div>
                )}
              </div>
              
              {isSearching && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-black-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {filteredConversations.length} 
                    {filteredConversations.length === 1 ? ' chat' : ' chats'} 
                    found
                  </span>
                  <button
                    onClick={() => {
                      setSearchDate(null);
                      filterConversationsByDate(null);
                    }}
                    className="text-xs text-[#00A676] hover:underline"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto py-2">
              {filteredConversations.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-8">
                  {isSearching ? 'No chats found for this date.' : 'No chats yet. Start a new chat!'}
                </div>
              ) : (
                filteredConversations.map(conv => (
                  <div
                    key={conv.id}
                    className={`group relative mx-2 my-1 rounded-lg cursor-pointer transition-colors ${
                      currentConversationId === conv.id 
                        ? 'bg-gray-100' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div 
                      onClick={() => setCurrentConversationId(conv.id)}
                      className="flex flex-col p-3 text-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <MessageCircle className="w-4 h-4 text-[#00A676]" />
                        <span className="truncate text-sm font-medium">
                          {formatDate(conv.createdAt)}
                        </span>
                      </div>
                      {conv.messages.length > 0 && (
                        <p className="ml-7 text-xs text-gray-500 truncate">
                          {conv.messages[0].content.substring(0, 40)}...
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 
                        opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Section */}
            <div className="border-t p-4">
              <button className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100 transition-colors">
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Header */}
          <div className="flex items-center p-4 border-b">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="ml-4 text-gray-800 font-semibold">CuraEase Symptom Checker</h1>
            {currentConversation && (
              <div className="ml-auto text-sm text-gray-500">
                {formatDate(currentConversation.createdAt)}
              </div>
            )}
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-800 p-6">
                <h2 className="text-3xl font-bold mb-6">How can we help?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
                  {quickActions.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickAction(item.prompt)}
                      className="p-6 rounded-lg border border-gray-200 hover:border-[#00A676] hover:shadow-md transition-all cursor-pointer flex items-center gap-4 bg-white"
                    >
                      <div className="p-3 rounded-full bg-[#f0fdf9]">
                        {item.icon}
                      </div>
                      <span className="text-sm font-medium">{item.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto py-4 px-6">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`my-4 ${
                      index === messages.length - 1 && isResponseAnimating && msg.role === 'assistant' 
                        ? 'animate-pulse'
                        : ''
                    }`}
                  >
                    <div className={`rounded-lg p-4 ${
                      msg.role === 'user' 
                        ? 'bg-white border border-gray-200 ml-12' 
                        : 'bg-[#f0fdf9] border border-[#e6f7f1] mr-12'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          msg.role === 'user' 
                            ? 'bg-[#00A676] text-white' 
                            : 'bg-[#00A676] bg-opacity-20 text-[#00A676]'
                        }`}>
                          {msg.role === 'user' ? 'You' : 'AI'}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-gray-800">
                              {msg.role === 'user' ? 'You' : 'CuraEase AI'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTime(msg.timestamp)}
                            </span>
                          </div>
                          <div className="text-gray-700 whitespace-pre-wrap">
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && messages.length > 0 && !isResponseAnimating && (
                  <div className="flex justify-center my-4">
                    <div className="bg-gray-100 rounded-full py-2 px-4 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-[#00A676] animate-spin" />
                      <span className="text-sm text-gray-600">CuraEase is thinking...</span>
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Medical Terms Box */}
          {definitions.length > 0 && (
            <div className="bg-white border-t border-gray-200">
              <div className="max-w-3xl mx-auto p-4">
                <div className="bg-[#f0fdf9] rounded-lg p-4 border border-[#e6f7f1]">
                  <h3 className="text-[#00A676] font-semibold flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4" />
                    Medical Terms Explained
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                    {definitions.map((def, i) => (
                      <div key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-[#00A676] mt-2"></div>
                        <span>{def}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t bg-white p-4">
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleSubmit} className="relative">
                {error && (
                  <div className="text-red-500 text-sm mb-2">
                    {error}
                  </div>
                )}
                <div className="flex items-center bg-white border border-gray-300 rounded-lg focus-within:border-[#00A676] overflow-hidden">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Describe your symptoms or ask a medical question..."
                    className="w-full px-4 py-3 outline-none text-gray-700"
                    disabled={isLoading}
                  />
                  <div className="flex items-center px-3">
                    <button
                      type="button"
                      className="p-1 text-gray-500 hover:text-[#00A676] transition-colors"
                      disabled={isLoading}
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                    <button
                      type="submit"
                      className={`ml-2 p-2 rounded-md ${
                        userInput.trim() && !isLoading
                          ? 'bg-[#00A676] text-white hover:bg-[#008c63]'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      } transition-colors`}
                      disabled={!userInput.trim() || isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 flex justify-between">
                  <span>Your conversation is private and won't be shared.</span>
                  <span>
                    {500 - userInput.length} characters remaining
                  </span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}