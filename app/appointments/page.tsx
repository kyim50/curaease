'use client';
import { useState } from 'react';
import { Calendar } from '../components/ui/calendar'; // Import the Calendar component
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
  doctor: string; // This holds the doctor's ID
  patient: string;
  start: Date;
  end: Date;
}

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Handle canceling appointments
  const handleCancel = (id: string) => {
    setAppointments(appointments.filter(a => a.id !== id));
  };

  // Available and booked days setup
  const availableDays: Date[] = [new Date()]; // Example: today is available
  const bookedAppointments: Date[] = appointments.map(app => app.start); // Use actual booked appointments

  // Handle booking appointments
  const handleBookAppointment = () => {
    if (!selectedDate || !selectedTime || !selectedDoctorId) {
      alert("Please select a date, time, and doctor for the appointment.");
      return;
    }

    const selectedDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    selectedDateTime.setHours(hours, minutes);

    const newAppointment: Appointment = {
      id: `${appointments.length + 1}`,
      doctor: selectedDoctorId,
      patient: "Patient Name", // You would replace this with actual patient data
      start: selectedDateTime,
      end: addHours(selectedDateTime, 1), // Assuming 1-hour appointments for now
    };

    setAppointments([...appointments, newAppointment]);
  };

  // Get doctor's name by ID
  const getDoctorNameById = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? doctor.fullName : "Unknown Doctor";
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-ds-primary">Appointment Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-ds-dark/50 p-6 rounded-lg border border-ds-primary/20">
          <Calendar
            availableDays={availableDays}
            bookedAppointments={bookedAppointments}
            onDaySelect={setSelectedDate} // Pass the selected date to the parent component
          />
        </div>

        <div className="bg-ds-dark/50 p-6 rounded-lg border border-ds-primary/20">
          <h2 className="text-xl font-semibold text-ds-primary mb-4">Your Appointments</h2>
          {appointments.map(app => (
            <div key={app.id} className="flex justify-between items-center p-4 mb-2 bg-ds-dark rounded">
              <div>
                <p className="font-medium text-ds-text">{getDoctorNameById(app.doctor)}</p>
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

      <div className="bg-ds-dark/50 p-6 rounded-lg border border-ds-primary/20">
        <h2 className="text-xl font-semibold text-ds-primary mb-4">Book an Appointment</h2>
        
        <div>
          <label htmlFor="doctor-select" className="block text-ds-primary mb-2">Select a Doctor:</label>
          <select
            id="doctor-select"
            className="block w-full p-2 border border-ds-primary rounded text-gray-800"  
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
          >
            <option value="">Select a Doctor</option>
            {doctors.map(doctor => (
              <option key={doctor.id} value={doctor.id}>{doctor.fullName}</option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <label htmlFor="time-select" className="block text-ds-primary mb-2">Select Appointment Time:</label>
          <input
            type="time"
            id="time-select"
            className="block w-full p-2 border border-ds-primary rounded text-gray-800"  // Ensuring text color is visible
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
          />
        </div>

        <div className="mt-4">
          <button
            onClick={handleBookAppointment}
            className="w-full bg-ds-primary text-white p-2 rounded-md hover:bg-ds-primary/80"
          >
            Book Appointment
          </button>
        </div>
      </div>
    </div>
  );
}
