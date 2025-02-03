// app/symptom-checker/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: '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',
  dangerouslyAllowBrowser: true, // Explicitly enable browser usage,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000", // Replace with your production URL
    "X-Title": "Medical Symptom Checker",
    
  }
});


interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

const MEDICAL_SYSTEM_PROMPT = `You are a medical AI assistant specializing in symptom analysis.
Follow these rules:
1. Ask one clarifying question at a time.
2. Focus on key diagnostic indicators.
3. Consider differential diagnoses with ICD-10 coding.
4. Use clear, natural language without requiring quotes.
5. Always recommend consulting a licensed physician.
6. Provide general medication recommendations (e.g., Panadol) with warnings about allergies.
7. Define medical terms that may be unfamiliar to the user.
8. End with "Preliminary Assessment:" when sufficient data has been collected.
For example, if a user describes "severe chest pain radiating to the left arm", ask for more details about the pain, duration, and any accompanying symptoms.`;

export default function SymptomChecker() {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [assessment, setAssessment] = useState('');
  const [rateLimit, setRateLimit] = useState(5);
  const [definitions, setDefinitions] = useState<string[]>([]);

  // Load conversation history from localStorage
  useEffect(() => {
    const savedConv = localStorage.getItem('med-conversation');
    if (savedConv) setConversation(JSON.parse(savedConv));
  }, []);

  // Save conversation to localStorage
  useEffect(() => {
    if (conversation.length > 0) {
      localStorage.setItem('med-conversation', JSON.stringify(conversation));
    }
  }, [conversation]);

  const createAuditLog = (action: string) => {
    console.log(`[AUDIT] ${new Date().toISOString()}: ${action}`);
  };

  const validateInput = (input: string): boolean => {
    const medicalRegex = /^[a-zA-Z0-9\s.,()\-\/]{3,200}$/;
    return medicalRegex.test(input);
  };

  const extractDefinitions = (response: string) => {
    const termRegex = /\[DEF:\s*(.*?)\]/g;
    const definitions = [];
    let match;
    while ((match = termRegex.exec(response)) !== null) {
      definitions.push(match[1]);
    }
    return definitions;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validateInput(userInput)) {
      setError('Please enter valid medical symptoms (3-200 characters)');
      return;
    }
    if (rateLimit <= 0) {
      setError('Daily limit reached. Please try tomorrow.');
      return;
    }

    setIsLoading(true);
    setError('');
    createAuditLog(`User input: ${userInput}`);

    try {
      const newConversation = [
        ...conversation,
        { role: 'user', content: userInput, timestamp: Date.now() }
      ];

      const completion = await openai.chat.completions.create({
        model: "deepseek/deepseek-r1-distill-qwen-1.5b",
        messages: [
          { role: 'system', content: MEDICAL_SYSTEM_PROMPT },
          ...newConversation.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        ],
      });

      const assistantResponse = completion.choices[0].message.content;

      setConversation([
        ...newConversation,
        { role: 'assistant', content: assistantResponse, timestamp: Date.now() }
      ]);

      setRateLimit(prev => prev - 1);

      if (assistantResponse.includes('Preliminary Assessment:')) {
        setAssessment(assistantResponse);
        createAuditLog(`Assessment generated: ${assistantResponse.substring(0, 50)}...`);
      }

      const definitions = extractDefinitions(assistantResponse);
      setDefinitions(definitions);

    } catch (err: any) {
      setError(err.message);
      createAuditLog(`Error: ${err.message}`);
      toast.error('Failed to analyze symptoms. Please try again.');
    } finally {
      setUserInput('');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Medical Symptom Analyzer</h1>
          <div className="text-sm text-gray-500">
            Remaining queries: {rateLimit}/5
          </div>
        </div>

        {error && (
          <div className="bg-red-100 p-4 rounded-lg mb-4 text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-8 max-h-[60vh] overflow-y-auto">
          {conversation.map((msg, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-50 ml-8'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex justify-between text-sm mb-1">
                <strong>{msg.role.toUpperCase()}</strong>
                <span className="text-gray-500">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          ))}
        </div>

        {!assessment && (
          <form onSubmit={handleSubmit} className="sticky bottom-0 bg-white pt-4">
            <div className="relative">
              <input
                type="text"
                value={userInput}
                onChange={(e) => {
                  setUserInput(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Describe your symptoms (e.g., 'severe chest pain radiating to the left arm')"
                className="border p-3 w-full rounded-lg mb-2 pr-16"
                disabled={isLoading || rateLimit <= 0}
              />
              <button
                type="submit"
                disabled={isLoading || rateLimit <= 0}
                className="absolute right-2 top-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {isLoading ? 'Analyzing...' : 'Send'}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Example: "sharp chest pain when breathing deeply, started 2 hours ago"
            </p>
          </form>
        )}

        {assessment && (
          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Medical Assessment</h2>
            <div className="whitespace-pre-wrap mb-6 bg-white p-4 rounded">
              {assessment}
            </div>
            <div className="bg-red-100 p-4 rounded-lg">
              <strong>Important Notice:</strong>
              <ul className="list-disc pl-6 mt-2">
                <li>This is not a medical diagnosis</li>
                <li>Urgency rating provided is approximate</li>
                <li>Always consult a licensed physician</li>
                <li>For emergencies, contact local emergency services</li>
                <li>Be aware of potential allergies to recommended medications</li>
              </ul>
            </div>
            <div className="mt-4 bg-yellow-100 p-4 rounded-lg">
              <strong>Medical Terms:</strong>
              <ul className="list-disc pl-6 mt-2">
                {definitions.map((def, index) => (
                  <li key={index}>{def}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}