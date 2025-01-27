// app/appointments/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { Calendar } from '../components/ui/calendar';
import { addHours, isWithinInterval } from 'date-fns';

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

  // Mock availability (replace with API call)
  const doctorAvailability = [
    { start: addHours(new Date(), 2), end: addHours(new Date(), 3) },
    { start: addHours(new Date(), 5), end: addHours(new Date(), 6) }
  ];

  const handleBook = (time: Date) => {
    const newAppointment: Appointment = {
      id: Math.random().toString(),
      doctor: "Dr. Smith",
      patient: "John Doe",
      start: time,
      end: addHours(time, 1)
    };
    setAppointments([...appointments, newAppointment]);
  };

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
          
          <div className="mt-6 space-y-2">
            <h3 className="text-xl font-semibold text-ds-primary">Available Slots</h3>
            {doctorAvailability.map((slot, i) => (
              <button
                key={i}
                onClick={() => handleBook(slot.start)}
                className="w-full p-2 text-left bg-ds-dark hover:bg-ds-primary/10 rounded border border-ds-primary/20"
              >
                {slot.start.toLocaleTimeString()} - {slot.end.toLocaleTimeString()}
              </button>
            ))}
          </div>
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