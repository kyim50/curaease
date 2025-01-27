// app/symptom-checker/page.tsx
"use client";

import { useState } from 'react';

const symptomQuestions = {
  headache: [
    'Is the pain throbbing or constant?',
    'Any sensitivity to light?',
    'Any nausea?'
  ],
  fever: [
    'How high is the temperature?',
    'Any chills?',
    'Duration of fever?'
  ]
};

export default function SymptomChecker() {
  const [currentSymptom, setCurrentSymptom] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [result, setResult] = useState('');

  const handleCheck = () => {
    const conditions = {
      headache: responses.includes('throbbing') ? 'Possible Migraine' : 'Tension Headache',
      fever: responses.includes('chills') ? 'Possible Flu' : 'Viral Infection'
    };
    setResult(conditions[currentSymptom] || 'Consult a healthcare professional');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Symptom Checker</h1>
      
      {!currentSymptom ? (
        <div className="space-y-4">
          <h2 className="text-xl">Select your main symptom:</h2>
          <button
            onClick={() => setCurrentSymptom('headache')}
            className="bg-green-500 text-white px-4 py-2 rounded mr-2"
          >
            Headache
          </button>
          <button
            onClick={() => setCurrentSymptom('fever')}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Fever
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl">{symptomQuestions[currentSymptom][currentStep]}</h2>
          <input
            type="text"
            placeholder="Your answer..."
            value={responses[currentStep] || ''}
            onChange={(e) => {
              const newResponses = [...responses];
              newResponses[currentStep] = e.target.value;
              setResponses(newResponses);
            }}
            className="border p-2 w-full"
          />
          <div className="flex gap-4">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Back
              </button>
            )}
            <button
              onClick={() => {
                if (currentStep < symptomQuestions[currentSymptom].length - 1) {
                  setCurrentStep(currentStep + 1);
                } else {
                  handleCheck();
                }
              }}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              {currentStep === symptomQuestions[currentSymptom].length - 1 ? 'Get Results' : 'Next'}
            </button>
          </div>
          {result && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold">Assessment Result:</h3>
              <p>{result}</p>
              <p className="mt-2 text-sm text-red-500">
                Note: This is not a medical diagnosis. Please consult a healthcare professional.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}