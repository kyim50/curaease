"use client";

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Fuse from 'fuse.js';
import Nav from '../components/nav';

interface Medication {
  name: string;
  dosage: string;
  time: string;
  frequency: string;
  taken?: boolean;
  color?: string;
  synonym?: string;
  fullName?: string;
  rxtermsDoseForm?: string;
  rxcui?: string;
  ingredients?: string[];
}

interface SearchResult {
  name: string;
  rxcui: string;
  [key: string]: any;
}

const MedicationDashboard = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [newMed, setNewMed] = useState<Medication>({ name: '', dosage: '', time: '', frequency: 'daily' });
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedColor, setSelectedColor] = useState('cyan');
  const [userName, setUserName] = useState('User');
  
  const inputRef = useRef<HTMLInputElement>(null);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const colors = ['cyan', 'purple', 'yellow', 'teal', 'red', 'blue'];
  const activeTab = 'This week';

  // Calculate progress percentage based on medications taken
  const calculateProgress = () => {
    if (medications.length === 0) return 100; // No medications means 100% completion
    
    const takenCount = medications.filter(med => med.taken).length;
    return Math.round((takenCount / medications.length) * 100);
  };

  // Get current day index for the calendar
  const getCurrentDayIndex = () => {
    const today = new Date().getDay();
    // Convert Sunday (0) to index 6, Monday (1) to index 0, etc.
    return today === 0 ? 6 : today - 1;
  };

  // Fetch medication data from RxNorm API
  const searchMedication = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await axios.get(`https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${query}&maxEntries=5`);

      if (response.data.approximateGroup?.candidate?.length === 0) {
        setSearchError('No results found.');
        setSuggestions([]);
        return;
      }

      const results = response.data.approximateGroup.candidate || [];

      if (results.length === 0) {
        setSearchError('No results found.');
        setSuggestions([]);
      } else {
        const medicationNames = results
          .map((med: any) => med.name?.trim() as string)
          .filter((name: string) => name);

        const normalizedNames = medicationNames.map((name: string) => name.toLowerCase());

        const uniqueMedicationNames = medicationNames.filter((name: string, index: number) => {
          const normalizedName = name.toLowerCase();
          return normalizedNames.indexOf(normalizedName) === index;
        });

        setSuggestions(uniqueMedicationNames);
        setSearchResults(results);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching medication data:', error);
        setSearchError('Failed to fetch medication data. Please try again.');
      }
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch detailed information for a medication using RxNorm RXCUI
  const fetchMedicationDetails = async (rxcui: string) => {
    try {
      const propertiesResponse = await axios.get(`https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/properties.json`);
      const properties = propertiesResponse.data.properties;

      const ingredientsResponse = await axios.get(`https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/related.json?tty=IN`);
      const ingredients = ingredientsResponse.data.relatedGroup?.conceptGroup?.[0]?.conceptProperties?.map(
        (ingredient: any) => ingredient.name
      ) || [];

      return {
        synonym: properties?.synonym || undefined,
        fullName: properties?.fullName || undefined,
        rxtermsDoseForm: properties?.rxtermsDoseForm || undefined,
        rxcui: properties?.rxcui || undefined,
        ingredients: ingredients.length > 0 ? ingredients : undefined,
      };
    } catch (error) {
      console.error('Error fetching medication details:', error);
      return {
        synonym: undefined,
        fullName: undefined,
        rxtermsDoseForm: undefined,
        rxcui: undefined,
        ingredients: undefined,
      };
    }
  };

  // Handle adding medication
  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedMedication = searchResults.find((med) => med.name === newMed.name);

    if (selectedMedication) {
      const details = await fetchMedicationDetails(selectedMedication.rxcui);
      const medicationWithDetails: Medication = {
        ...newMed,
        ...details,
        color: selectedColor,
        taken: false
      };
      setMedications([...medications, medicationWithDetails]);
      setNewMed({ name: '', dosage: '', time: '', frequency: 'daily' });
      setSearchResults([]);
      setSuggestions([]);
      setSearchError(null);
      setShowAddForm(false);
    }
  };

  // Toggle medication taken status
  const toggleMedicationStatus = (index: number) => {
    const updatedMedications = [...medications];
    updatedMedications[index].taken = !updatedMedications[index].taken;
    setMedications(updatedMedications);
  };

  // Fuzzy search for medication names
  useEffect(() => {
    if (newMed.name.trim() && searchResults.length > 0) {
      const fuse = new Fuse<SearchResult>(searchResults, {
        keys: ['name'],
        threshold: 0.3,
        ignoreLocation: true,
        includeMatches: true,
        findAllMatches: true,
      });
      
      const results = fuse.search(newMed.name);
      const matchedItems = results.map(result => result.item);
      setSearchResults(matchedItems);

      if (results.length > 0 && results[0]?.score !== undefined && results[0].score < 0.4) {
        const firstResult = results[0].item;
        if (firstResult?.name) {
          setNewMed((prev) => ({ ...prev, name: firstResult.name }));
        }
      }
    }
  }, [newMed.name]);

  // Handle selecting a suggestion from the autocomplete dropdown
  const handleSuggestionClick = (suggestion: string) => {
    setNewMed((prev) => ({ ...prev, name: suggestion }));
    setSuggestions([]);
    setSearchError(null);
  };

  // Handle blur event on the input field
  const handleBlur = () => {
    setTimeout(() => {
      setSuggestions([]);
      setSearchError(null);
    }, 200);
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    if (!timeString) return 'Time not set';
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit'
      });
    } catch (e) {
      return timeString;
    }
  };

  // Get current date formatted
  const getCurrentDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date().toLocaleDateString('en-US', options).toUpperCase();
  };

  // Sort medications by time
  const sortedMedications = [...medications].sort((a, b) => 
    a.time > b.time ? 1 : -1
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <div className="max-w-6xl mx-auto pt-8 px-6">
        {/* Header with greeting and progress */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Hi, {userName}</h1>
              <p className="text-gray-500 mt-1">Treatment progress</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-[#00A676] h-2 rounded-full" 
              style={{ width: `${calculateProgress()}%` }}
            ></div>
          </div>
          
          {/* Time period tabs */}
          <div className="flex space-x-4 mt-4">
            {['This week', 'This month', 'This year'].map((tab) => (
              <button 
                key={tab}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab 
                    ? 'bg-[#00A676] bg-opacity-10 text-[#00A676]' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2 mt-6">
            {days.map((day, index) => (
              <div key={day} className="text-center">
                <p className="text-sm text-gray-500 mb-2">{day}</p>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto
                  ${index === getCurrentDayIndex() ? 'bg-[#00A676] text-white' : 
                    index < getCurrentDayIndex() ? 'bg-[#00A676] bg-opacity-10 text-[#00A676] border border-[#00A676]' : 
                    'bg-gray-100 text-gray-400'}`}>
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Today's Medications */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">{getCurrentDate()}</h2>
            <button 
              onClick={() => setShowAddForm(!showAddForm)} 
              className="px-4 py-2 bg-[#00A676] text-white font-medium rounded-full hover:bg-[#008c63] transition-colors"
            >
              {showAddForm ? 'Cancel' : '+ Add Medication'}
            </button>
          </div>
          
          {/* Medication list */}
          {medications.length === 0 ? (
            <div className="bg-gray-50 p-6 rounded-xl text-gray-500 text-center">
              <p>No medications added yet. Click the "Add Medication" button to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedMedications.map((med, index) => (
                <div key={index} className="flex items-center p-4 border rounded-xl hover:bg-gray-50">
                  <div className={`w-10 h-10 bg-${med.color || 'cyan'}-500 bg-opacity-20 rounded-full flex items-center justify-center mr-4`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-${med.color || 'cyan'}-500`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="font-medium text-gray-800">{med.name}</h3>
                      <span className="ml-2 px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded-full">{med.frequency}</span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                      {med.dosage} · {formatTime(med.time)}
                    </p>
                  </div>
                  <div>
                    <div 
                      className={`w-6 h-6 rounded border ${med.taken ? 'bg-[#00A676] border-[#00A676]' : 'border-[#00A676]'} flex items-center justify-center cursor-pointer`}
                      onClick={() => toggleMedicationStatus(index)}
                    >
                      {med.taken && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Add Medication Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Schedule the Dose</h2>
            <form onSubmit={handleAddMedication} className="space-y-6">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">Medication Name</label>
                <input
                  type="text"
                  value={newMed.name}
                  onChange={(e) => {
                    setNewMed({...newMed, name: e.target.value});
                    searchMedication(e.target.value);
                  }}
                  onBlur={handleBlur}
                  ref={inputRef}
                  placeholder="e.g., Probiotic"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A676]"
                  required
                />
                {(suggestions.length > 0 || searchError) && (
                  <div className="absolute z-10 bg-white border border-gray-300 mt-1 w-full rounded-lg shadow-lg">
                    {suggestions.length > 0 ? (
                      suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="p-3 hover:bg-gray-100 cursor-pointer text-gray-800"
                        >
                          {suggestion}
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-gray-500">{searchError || 'No results found.'}</div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dosage</label>
                  <input
                    type="text"
                    placeholder="e.g., 500mg"
                    value={newMed.dosage}
                    onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A676]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <input
                    type="time"
                    value={newMed.time}
                    onChange={(e) => setNewMed({ ...newMed, time: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A676]"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                <select
                  value={newMed.frequency}
                  onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A676]"
                >
                  <option value="daily">Daily</option>
                  <option value="twice daily">Twice Daily</option>
                  <option value="three times daily">Three Times Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="as-needed">As Needed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Appearance</label>
                <div className="flex space-x-4">
                  {colors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full bg-${color}-500 flex items-center justify-center ${selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                    >
                      {selectedColor === color && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              <button 
                type="submit" 
                className="w-full py-3 bg-[#00A676] text-white font-medium rounded-xl hover:bg-[#008c63] transition-colors"
              >
                Add Medication
              </button>
            </form>
          </div>
        )}
        
        {/* Today's Schedule */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Today's Schedule</h2>
          {medications.length === 0 ? (
            <p className="text-gray-500">No medications scheduled for today.</p>
          ) : (
            <div className="space-y-4">
              {sortedMedications.map((med, index) => (
                <div key={`schedule-${index}`} className="flex items-center p-4 border rounded-xl hover:bg-gray-50">
                  <div className={`w-10 h-10 bg-[#00A676] bg-opacity-20 rounded-full flex items-center justify-center mr-4`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#00A676]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{med.name} - {med.dosage}</h3>
                    <p className="text-gray-500 text-sm">{formatTime(med.time)}</p>
                    {med.rxtermsDoseForm && <p className="text-gray-500 text-sm">Form: {med.rxtermsDoseForm}</p>}
                  </div>
                  <div className="flex space-x-2">
                    {med.ingredients && med.ingredients.length > 0 && (
                      <div className="relative group">
                        <button className="p-2 text-[#00A676] hover:bg-[#00A676] hover:bg-opacity-10 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        <div className="absolute right-0 w-64 bg-white shadow-lg rounded-lg p-3 hidden group-hover:block z-10">
                          <div className="text-sm">
                            {med.rxcui && <p className="text-gray-600">RxCUI: {med.rxcui}</p>}
                            {med.fullName && <p className="text-gray-600">Full Name: {med.fullName}</p>}
                            <p className="text-gray-600">Ingredients: {med.ingredients.join(', ')}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <button 
                      className="p-2 text-[#00A676] hover:bg-[#00A676] hover:bg-opacity-10 rounded-full"
                      onClick={() => toggleMedicationStatus(index)}
                    >
                      {med.taken ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicationDashboard;