"use client";
import { useState } from 'react';
import { Calendar } from '../components/ui/calendar';
import { addHours } from 'date-fns';

interface Doctor {
  id: string;
  fullName: string;
  specialty: string;
}

const doctors: Doctor[] = [
  {
    id: "1",
    fullName: "Dr. Davis",
    specialty: "Paediatrician"
  },
  {
    id: "2",
    fullName: "Dr. Jane",
    specialty: "General Physician"
  },
  {
    id: "3",
    fullName: "Dr. Brown",
    specialty: "Surgeon"
  },
  {
    id: "4",
    fullName: "Dr. Walker",
    specialty: "Gastroenterologist"
  },
  {
    id: "5",
    fullName: "Dr. Brown",
    specialty: "Dermatologist"
  }
];

interface Appointment {
  id: string;
  doctor: string;
  patient: string;
  start: Date;
  end: Date;
}

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const handleCancel = (id: string) => {
    setAppointments(appointments.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-ds-primary">Appointment Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-ds-dark/50 p-6 rounded-lg border border-ds-primary/20">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
          />
        </div>

        <div className="bg-ds-dark/50 p-6 rounded-lg border border-ds-primary/20">
          <h2 className="text-xl font-semibold text-ds-primary mb-4">Your Appointments</h2>
          {appointments.map(app => (
            <div key={app.id} className="flex justify-between items-center p-4 mb-2 bg-ds-dark rounded">
              <div>
                <p className="font-medium">{app.doctor}</p>
                <p className="text-sm text-ds-text/80">
                  {app.start.toLocaleDateString()} {app.start.toLocaleTimeString()}
                </p>
              </div>
              <button 
                onClick={() => handleCancel(app.id)}
                className="text-red-400 hover:text-red-300"
              >
                Cancel
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}