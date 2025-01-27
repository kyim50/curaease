// app/medications/page.tsx
"use client";

import { useState } from 'react';

interface Medication {
  name: string;
  dosage: string;
  time: string;
  frequency: string;
}

export default function MedicationSchedule() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [newMed, setNewMed] = useState<Medication>({ name: '', dosage: '', time: '', frequency: 'daily' });

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    setMedications([...medications, newMed]);
    setNewMed({ name: '', dosage: '', time: '', frequency: 'daily' });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Medication Management</h1>
      
      <form onSubmit={handleAddMedication} className="space-y-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Medication Name"
            value={newMed.name}
            onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
            className="border p-2"
            required
          />
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
        <h2 className="text-2xl font-semibold">Current Schedule</h2>
        {medications.map((med, index) => (
          <div key={index} className="p-4 border rounded-lg">
            <h3 className="font-bold">{med.name}</h3>
            <p>Dosage: {med.dosage}</p>
            <p>Time: {med.time}</p>
            <p>Frequency: {med.frequency}</p>
          </div>
        ))}
      </div>
    </div>
  );
}