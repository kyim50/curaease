"use client";

import { useState, useEffect } from "react";

type LocationType = {
  lat: number;
  lng: number;
} | null;

export default function HealthInfo() {
  const [location, setLocation] = useState<LocationType>(null);
  const [error, setError] = useState<string | null>(null);

  const emergencyContacts = [
    { country: "Jamaica", number: "Jamaica Constabulary Force: 119"},
    { country: "Jamaica", number: "Fire Department: 110"},
    { country : "Jamaica", number: "Met Service: 116"}
  ];

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => setError("Location access denied.")
      );
    } else {
      setError("Geolocation is not supported.");
    }
  }, []);

  const sendEmergencyAlert = () => {
    alert("Emergency alert sent to designated contacts!");
    /// prolly a database with contacts if we doing a login uk
  };

  return (
    <div className="max-w-4xl mx-auto p-6 border rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6">Health Information</h1>
      
      {/* Health Resources */}
      <h2 className="text-xl font-semibold mb-3">Health Resources</h2>
      <ul className="space-y-4">
        <li>
          <a
            href="https://www.mayoclinic.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            Mayo Clinic
          </a>
        </li>
        <li>
          <a
            href="https://www.webmd.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            WebMD
          </a>
        </li>
        <li>
          <a
            href="https://www.who.int"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            World Health Organization (WHO)
          </a>
        </li>
      </ul>

      {/* Emergency Assistance */}
      <h2 className="text-2xl font-semibold mt-6">Emergency Assistance</h2>

      {/* Emergency Contacts */}
      <h3 className="text-xl font-semibold mb-3">Emergency Contacts</h3>
      <ul className="space-y-2">
        {emergencyContacts.map((contact, index) => (
          <li key={index} className="text-lg">
            <strong>{contact.country}:</strong> {contact.number}
          </li>
        ))}
      </ul>

      {/* Nearest Hospital Link */}
      <h3 className="text-xl font-semibold mt-6">Find Nearest Hospital</h3>
      {location ? (
        <a
          href={`https://www.google.com/maps/search/hospital/@${location.lat},${location.lng},15z`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline block mt-2"
        >
          Click here to find the nearest hospital
        </a>
      ) : (
        <p className="text-red-500">{error || "Fetching location..."}</p>
      )}

      {/* Emergency Alert Button */}
      <button
        onClick={sendEmergencyAlert}
        className="mt-6 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Send Emergency Alert
      </button>
    </div>
  );
}
