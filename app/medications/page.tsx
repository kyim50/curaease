// app/medications/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Fuse from 'fuse.js';
import Nav from '../components/nav';

interface Medication {
  name: string;
  dosage: string;
  time: string;
  frequency: string;
  synonym?: string; // Optional
  fullName?: string; // Optional full name field
  rxtermsDoseForm?: string; // Optional dose form field
  rxcui?: string; // Optional RxNorm Concept Unique Identifier
  ingredients?: string[]; // Optional
}

export default function MedicationSchedule() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [newMed, setNewMed] = useState<Medication>({ name: '', dosage: '', time: '', frequency: 'daily' });
  const [searchResults, setSearchResults] = useState<any[]>([]); // Store search results from API
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]); // Store autocomplete suggestions
  const [searchError, setSearchError] = useState<string | null>(null); // Store search error messages
  const inputRef = useRef<HTMLInputElement>(null); // Ref for the input field

  // Fetch medication data from RxNorm API
  const searchMedication = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null); // Clear previous errors

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
        // Extract medication names for autocomplete
        const medicationNames = results
          .map((med: any) => med.name?.trim() as string) // Explicitly type `name` as string
          .filter((name: string) => name); // Filter out empty or whitespace-only names

        // Normalize names to lowercase for comparison
        const normalizedNames = medicationNames.map((name: string) => name.toLowerCase());

        // Remove duplicates using a Set, preserving the correctly capitalized version
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
      // Fetch properties
      const propertiesResponse = await axios.get(`https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/properties.json`);
      const properties = propertiesResponse.data.properties;

      // Fetch ingredients
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
      };
      setMedications([...medications, medicationWithDetails]);
      setNewMed({ name: '', dosage: '', time: '', frequency: 'daily' });
      setSearchResults([]); // Clear search results
      setSuggestions([]); // Clear suggestions
      setSearchError(null); // Clear error message
    }
  };

  // Fuzzy search for medication names
  useEffect(() => {
    if (newMed.name.trim()) {
      const fuse = new Fuse(searchResults, {
        keys: ['name'],
        threshold: 0.3, // Adjust threshold for fuzzy search (lower = stricter)
        ignoreLocation: true, // Search across the entire string
        includeMatches: true, // Include match details
        findAllMatches: true, // Find all matches
      });
      const results = fuse.search(newMed.name);
      setSearchResults(results.map((result) => result.item));

      // Autocorrect: If there's a close match, update the input field
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
    setSuggestions([]); // Clear suggestions after selection
    setSearchError(null); // Clear error message
  };

  // Handle blur event on the input field
  const handleBlur = () => {
    // Use setTimeout to delay hiding the dropdown and error message
    setTimeout(() => {
      setSuggestions([]);
      setSearchError(null); // Clear the error message
    }, 200);
  };

  return (
    <div>
      <Nav />
      <div className="max-w-4xl mx-auto pt-8 pl-10">
        <h1 className="text-3xl font-bold mb-6 text-ds-dark">Medication Management</h1>

        <form onSubmit={handleAddMedication} className="space-y-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-ds-dark">
            <div className="relative">
              <input
                type="text"
                placeholder="Medication Name"
                value={newMed.name}
                onChange={(e) => {
                  setNewMed({ ...newMed, name: e.target.value });
                  searchMedication(e.target.value); // Trigger search on input change
                }}
                onBlur={handleBlur} // Handle blur event
                ref={inputRef} // Attach ref to the input field
                className="border p-2 placeholder:text-gray-500 w-full"
                required
              />
              {/* Autocomplete dropdown */}
              {(suggestions.length > 0 || searchError) && (
                <div className="absolute z-10 bg-white border border-gray-300 mt-1 w-full rounded-lg shadow-lg">
                  {suggestions.length > 0 ? (
                    suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                      >
                        {suggestion}
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-gray-500">{searchError || 'No results found.'}</div>
                  )}
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="Dosage"
              value={newMed.dosage}
              onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
              className="border p-2"
              required
            />
            <input
              type="time"
              value={newMed.time}
              onChange={(e) => setNewMed({ ...newMed, time: e.target.value })}
              className="border p-2"
              required
            />
            <select
              value={newMed.frequency}
              onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
              className="border p-2"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="as-needed">As Needed</option>
            </select>
          </div>
          <button type="submit" className="bg-purple-500 text-white px-4 py-2 rounded">
            Add Medication
          </button>
        </form>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-ds-dark">Current Schedule</h2>
          {medications.map((med, index) => (
            <div key={index} className="p-4 border rounded-lg text-ds-dark">
              <div>
                <h3 className="font-bold">{med.name}</h3>
                <p>Dosage: {med.dosage}</p>
                <p>Time: {med.time}</p>
                <p>Frequency: {med.frequency}</p>
                {med.synonym && <p>Synonym: {med.synonym}</p>}
                {med.fullName && <p>Full Name: {med.fullName}</p>}
                {med.rxtermsDoseForm && <p>Dose Form: {med.rxtermsDoseForm}</p>}
                {med.rxcui && <p>RxCUI: {med.rxcui}</p>}
                {med.ingredients && (
                  <p>Ingredients: {med.ingredients.join(', ')}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}