"use client";

import { useState, useEffect } from "react";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set your Mapbox token here
mapboxgl.accessToken = 'pk.eyJ1Ijoia3lpbTUwIiwiYSI6ImNsempkcm9odDBjYnIybXEyeW5wa2VhbjkifQ.IWRIlnDyJOQkeWiB5dH28Q';

type LocationType = {
  lat: number;
  lng: number;
} | null;

type MedicationType = {
  name: string;
  description: string;
  usedFor: string[];
  sideEffects: string[];
  allergies: string[];
  category?: string;
  dosage?: string;
};

export default function HealthInfo() {
  const [location, setLocation] = useState<LocationType>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<MedicationType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const emergencyContacts = [
    { country: "Jamaica", number: "Jamaica Constabulary Force: 119" },
    { country: "Jamaica", number: "Fire Department: 110" },
    { country: "Jamaica", number: "Ambulance: 110" },
    { country: "Jamaica", number: "Met Service: 116" },
    { country: "Jamaica", number: "Poison Control: 1-888-764-7667" }
  ];
  
  const medications: MedicationType[] = [
    {
      name: "Paracetamol",
      description: "Common pain reliever and fever reducer",
      usedFor: ["Headache", "Fever", "Minor aches and pains"],
      sideEffects: ["Nausea", "Liver damage (in high doses)"],
      allergies: ["Paracetamol sensitivity"],
      category: "Pain Relief",
      dosage: "500-1000mg every 4-6 hours, max 4g daily"
    },
    {
      name: "Ibuprofen",
      description: "Non-steroidal anti-inflammatory drug (NSAID)",
      usedFor: ["Pain relief", "Inflammation", "Fever"],
      sideEffects: ["Stomach upset", "Heartburn", "Dizziness"],
      allergies: ["Aspirin sensitivity", "NSAID allergies"],
      category: "Pain Relief",
      dosage: "200-400mg every 4-6 hours, max 1200mg daily"
    },
    {
      name: "Amoxicillin",
      description: "Penicillin-type antibiotic",
      usedFor: ["Bacterial infections", "Respiratory infections", "Ear infections"],
      sideEffects: ["Diarrhea", "Rash", "Nausea"],
      allergies: ["Penicillin allergy", "Cephalosporin sensitivity"],
      category: "Antibiotics",
      dosage: "250-500mg three times daily for 7-14 days"
    },
    {
      name: "Loratadine",
      description: "Non-drowsy antihistamine",
      usedFor: ["Allergies", "Hay fever", "Hives"],
      sideEffects: ["Headache", "Dry mouth", "Fatigue"],
      allergies: ["Antihistamine sensitivity"],
      category: "Allergy",
      dosage: "10mg once daily"
    },
    {
      name: "Lisinopril",
      description: "ACE inhibitor for blood pressure control",
      usedFor: ["Hypertension", "Heart failure", "Post-heart attack recovery"],
      sideEffects: ["Dry cough", "Dizziness", "Headache"],
      allergies: ["ACE inhibitor sensitivity"],
      category: "Blood Pressure",
      dosage: "10-40mg once daily"
    },
    {
      name: "Metformin",
      description: "Oral medication for type 2 diabetes",
      usedFor: ["Type 2 diabetes", "Insulin resistance", "Prediabetes"],
      sideEffects: ["Nausea", "Diarrhea", "Stomach pain"],
      allergies: ["Metformin sensitivity"],
      category: "Diabetes",
      dosage: "500-1000mg twice daily with meals"
    },
    {
      name: "Atorvastatin",
      description: "Statin medication to lower cholesterol",
      usedFor: ["High cholesterol", "Cardiovascular disease prevention"],
      sideEffects: ["Muscle pain", "Liver enzyme abnormalities", "Headache"],
      allergies: ["Statin sensitivity"],
      category: "Cholesterol",
      dosage: "10-80mg once daily, preferably in the evening"
    },
    {
      name: "Sertraline",
      description: "Selective serotonin reuptake inhibitor (SSRI)",
      usedFor: ["Depression", "Anxiety disorders", "PTSD"],
      sideEffects: ["Nausea", "Insomnia", "Sexual dysfunction"],
      allergies: ["SSRI sensitivity"],
      category: "Mental Health",
      dosage: "50-200mg once daily"
    },
    {
      name: "Albuterol",
      description: "Bronchodilator for asthma relief",
      usedFor: ["Asthma attacks", "COPD", "Exercise-induced bronchospasm"],
      sideEffects: ["Tremors", "Rapid heartbeat", "Nervousness"],
      allergies: ["Albuterol sensitivity"],
      category: "Respiratory",
      dosage: "2 inhalations every 4-6 hours as needed"
    },
    {
      name: "Omeprazole",
      description: "Proton pump inhibitor for acid reflux",
      usedFor: ["GERD", "Ulcers", "Heartburn"],
      sideEffects: ["Headache", "Nausea", "Vitamin B12 deficiency (long-term)"],
      allergies: ["PPI sensitivity"],
      category: "Digestive",
      dosage: "20-40mg once daily before breakfast"
    },
    {
      name: "Warfarin",
      description: "Anticoagulant (blood thinner)",
      usedFor: ["Blood clot prevention", "Atrial fibrillation", "Deep vein thrombosis"],
      sideEffects: ["Bruising", "Bleeding", "Requires regular monitoring"],
      allergies: ["Warfarin sensitivity"],
      category: "Blood Thinners",
      dosage: "Individualized dosing based on INR levels"
    },
    {
      name: "Levothyroxine",
      description: "Synthetic thyroid hormone",
      usedFor: ["Hypothyroidism", "Thyroid hormone replacement"],
      sideEffects: ["Weight changes", "Nervousness", "Insomnia"],
      allergies: ["Levothyroxine sensitivity"],
      category: "Hormones",
      dosage: "25-200mcg once daily on empty stomach"
    }
  ];

  const categories = Array.from(new Set(medications.map(med => med.category)));

  const filteredMedications = medications.filter(med => 
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
    (activeCategory === null || med.category === activeCategory)
  );

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(userLocation);
          initializeMap(userLocation);
        },
        () => setError("Location access denied.")
      );
    } else {
      setError("Geolocation is not supported.");
    }
  }, []);

  const initializeMap = (userLocation: { lat: number; lng: number }) => {
    if (!userLocation) return;

    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v10',
      center: [userLocation.lng, userLocation.lat],
      zoom: 12,
      interactive: true,
    });

    // Add user location marker
    new mapboxgl.Marker({ color: '#00A676' })
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map);

    // Mock nearby hospitals (in a real app, you'd fetch this data)
    const hospitals = [
      { name: "General Hospital", coords: [userLocation.lng + 0.01, userLocation.lat + 0.008] },
      { name: "St. Mary's Hospital", coords: [userLocation.lng - 0.015, userLocation.lat - 0.005] },
      { name: "Children's Medical Center", coords: [userLocation.lng + 0.02, userLocation.lat - 0.01] }
    ];

    // Add hospital markers
    hospitals.forEach(hospital => {
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`<h3>${hospital.name}</h3><p>Open 24 hours</p>`);

      new mapboxgl.Marker({ color: '#0077B6' })
        .setLngLat(hospital.coords)
        .setPopup(popup)
        .addTo(map);
    });

    // Fit bounds to include all markers
    const bounds = hospitals.reduce((bounds, hospital) => {
      return bounds.extend(hospital.coords);
    }, new mapboxgl.LngLatBounds([userLocation.lng, userLocation.lat], [userLocation.lng, userLocation.lat]));

    map.fitBounds(bounds, { padding: 50 });

    map.on('load', () => {
      // Add click event to expand map
      mapContainer.addEventListener('click', () => {
        if (!mapExpanded) {
          setMapExpanded(true);
        }
      });
    });
  };

  const sendEmergencyAlert = () => {
    alert("Emergency alert sent to designated contacts!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white p-4 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-[#00A676]">CuraEase</h1>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Health Information</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="md:col-span-1 space-y-6">
            {/* Emergency Contacts Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                Emergency Contacts
              </h2>
              <ul className="space-y-3">
                {emergencyContacts.map((contact, index) => (
                  <li key={index} className="flex items-center p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                    <span className="text-gray-700">{contact.number}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={sendEmergencyAlert}
                className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors w-full font-medium"
              >
                Send Emergency Alert
              </button>
            </div>
            
            {/* Health Resources Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#00A676]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Health Resources
              </h2>
              <div className="space-y-3">
                <a
                  href="https://www.mayoclinic.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-[#00A676] rounded-full flex items-center justify-center text-white mr-3">MC</div>
                  <div>
                    <h3 className="font-medium text-gray-800">Mayo Clinic</h3>
                    <p className="text-sm text-gray-500">Comprehensive health information</p>
                  </div>
                </a>
                <a
                  href="https://www.webmd.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white mr-3">WM</div>
                  <div>
                    <h3 className="font-medium text-gray-800">WebMD</h3>
                    <p className="text-sm text-gray-500">Medical information and tools</p>
                  </div>
                </a>
                <a
                  href="https://www.who.int"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-white mr-3">WHO</div>
                  <div>
                    <h3 className="font-medium text-gray-800">World Health Organization</h3>
                    <p className="text-sm text-gray-500">Global health guidance</p>
                  </div>
                </a>
                <a
                  href="https://www.cdc.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white mr-3">CDC</div>
                  <div>
                    <h3 className="font-medium text-gray-800">Centers for Disease Control</h3>
                    <p className="text-sm text-gray-500">Disease prevention resources</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Mapbox Map Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Nearby Hospitals
              </h2>
              {error ? (
                <p className="text-red-500">{error}</p>
              ) : (
                <div 
                  id="map" 
                  className={`relative rounded-lg overflow-hidden ${mapExpanded ? 'h-96' : 'h-64'} cursor-pointer transition-all duration-300`}
                >
                  {!location && <div className="absolute inset-0 flex items-center justify-center bg-gray-100">Loading map...</div>}
                  {mapExpanded && (
                    <button 
                      className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow-md"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMapExpanded(false);
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  )}
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Click on the map to expand view. Blue markers indicate nearby hospitals.
              </p>
            </div>
            
            {/* Medication Directory */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#00A676]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                Medication Directory
              </h2>
              <div className="mb-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search medications..."
                  className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  className={`px-3 py-1 rounded-full text-sm ${activeCategory === null ? 'bg-[#00A676] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  onClick={() => setActiveCategory(null)}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`px-3 py-1 rounded-full text-sm ${activeCategory === category ? 'bg-[#00A676] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    onClick={() => setActiveCategory(category || null)}
                  >
                    {category}
                  </button>
                ))}
              </div>
              
              <div className="h-64 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 gap-3">
                  {filteredMedications.length > 0 ? (
                    filteredMedications.map((med) => (
                      <div 
                        key={med.name} 
                        className="border rounded-lg p-3 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedMedication(med)}
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium text-[#00A676]">{med.name}</h3>
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">{med.category}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{med.description}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 p-3 text-center">No medications found</p>
                  )}
                </div>
              </div>
              
              {selectedMedication && (
                <div className="mt-6 bg-gray-50 p-4 rounded-lg border">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-medium text-[#00A676]">{selectedMedication.name}</h3>
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600 inline-block mt-1">{selectedMedication.category}</span>
                    </div>
                    <button 
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => setSelectedMedication(null)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                  <p className="text-gray-700 my-3">{selectedMedication.description}</p>
                  
                  {selectedMedication.dosage && (
                    <div className="bg-blue-50 text-blue-800 p-3 rounded-lg mb-4 text-sm">
                      <strong>Typical Dosage:</strong> {selectedMedication.dosage}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium text-[#00A676] mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Used For
                      </h4>
                      <ul className="space-y-1">
                        {selectedMedication.usedFor.map((use, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-center">
                            <div className="w-1.5 h-1.5 bg-[#00A676] rounded-full mr-2"></div>
                            {use}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-amber-600 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                        Side Effects
                      </h4>
                      <ul className="space-y-1">
                        {selectedMedication.sideEffects.map((effect, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-center">
                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></div>
                            {effect}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-red-600 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Allergies
                      </h4>
                      <ul className="space-y-1">
                        {selectedMedication.allergies.map((allergy, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-center">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></div>
                            {allergy}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Health Tips Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#00A676]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Daily Health Tips
              </h2>
              <div className="space-y-3">
                <div className="bg-green-50 p-3 rounded-lg">
                  <h3 className="font-medium text-[#00A676] mb-1">Stay Hydrated</h3>
                  <p className="text-sm text-gray-700">Drink at least 8 glasses of water daily to maintain proper hydration and support bodily functions.</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h3 className="font-medium text-blue-600 mb-1">Regular Exercise</h3>
                  <p className="text-sm text-gray-700">Aim for at least 30 minutes of moderate physical activity most days of the week.</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <h3 className="font-medium text-purple-600 mb-1">Quality Sleep</h3>
                  <p className="text-sm text-gray-700">Prioritize 7-9 hours of quality sleep each night to support immune function and mental health.</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <h3 className="font-medium text-amber-600 mb-1">Balanced Diet</h3>
                  <p className="text-sm text-gray-700">Incorporate a variety of fruits, vegetables, whole grains, and lean proteins in your daily meals.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 p-6 mt-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">CuraEase</h3>
              <p className="text-gray-400">Providing accessible health information and emergency services to communities in Jamaica.</p>
            </div>
            <div>
              <h4 className="text-lg font-medium text-white mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Services</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-medium text-white mb-4">Contact Us</h4>
              <address className="not-italic text-gray-400">
                <p>123 Health Street</p>
                <p>Kingston, Jamaica</p>
                <p className="mt-2">Email: info@curaease.com</p>
                <p>Phone: +1 (876) 555-1234</p>
              </address>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} CuraEase. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}