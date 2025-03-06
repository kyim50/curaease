'use client';
import { useState, useEffect } from 'react';
import { Calendar } from '../components/ui/calendar';
import { addHours, setHours, setMinutes, areIntervalsOverlapping } from 'date-fns';
import Nav from '../components/nav';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust this import based on your Firebase config path

interface Doctor {
  uid: string;
  firstName: string;
  lastName: string;
  specialty: string;
  email: string;
}

interface Appointment {
  id: string;
  doctor: string; // This holds the doctor's UID
  patient: string;
  start: Date;
  end: Date;
  type: 'Consultation' | 'Checkup' | 'Specialization';
}

const appointmentDurations = {
  Consultation: 1,
  Checkup: 2,
  Specialization: 3
};

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAppointmentType, setSelectedAppointmentType] = useState<'Consultation' | 'Checkup' | 'Specialization'>('Consultation');

  // Fetch doctors from Firestore
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const doctorsCollection = collection(db, 'doctors');
        const doctorSnapshot = await getDocs(doctorsCollection);
        const doctorsList = doctorSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as Doctor[];
        
        setDoctors(doctorsList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching doctors:', error);
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const handleCancel = (id: string) => {
    setAppointments(appointments.filter(a => a.id !== id));
  };

  const getDoctorAppointments = (doctorId: string, date: Date): Appointment[] => {
    return appointments.filter(app => app.doctor === doctorId && app.start.toDateString() === date.toDateString());
  };

  const findAvailableSlot = (doctorId: string, date: Date, duration: number): Date | null => {
    const doctorAppointments = getDoctorAppointments(doctorId, date);
    let startTime = setMinutes(setHours(date, 9), 0); // Start at 9 AM
    const endTime = setMinutes(setHours(date, 17), 0); // End at 5 PM

    while (startTime < endTime) {
      const endSlot = addHours(startTime, duration);
      const slotIsAvailable = !doctorAppointments.some(app => 
        areIntervalsOverlapping(
          { start: app.start, end: app.end },
          { start: startTime, end: endSlot }
        )
      );

      if (slotIsAvailable) {
        return startTime;
      }

      startTime = addHours(startTime, 1); // Move to the next hour
    }

    return null; // No available slot found
  };

  const handleBookAppointment = () => {
    if (!selectedDate || !selectedDoctorId) {
      alert("Please select a date and a doctor for the appointment.");
      return;
    }

    const duration = appointmentDurations[selectedAppointmentType];
    const availableSlot = findAvailableSlot(selectedDoctorId, selectedDate, duration);

    if (!availableSlot) {
      alert("No available slots for the selected date and doctor.");
      return;
    }

    const newAppointment: Appointment = {
      id: `${appointments.length + 1}`,
      doctor: selectedDoctorId,
      patient: "Patient Name", // Replace with actual patient data
      start: availableSlot,
      end: addHours(availableSlot, duration),
      type: selectedAppointmentType
    };

    setAppointments([...appointments, newAppointment]);
  };

  const getDoctorFullName = (doctorId: string) => {
    const doctor = doctors.find(d => d.uid === doctorId);
    return doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : "Unknown Doctor";
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading doctors...</div>;
  }

  return (
    <div>
    <Nav />
    <div className="space-y-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-ds-primary">Appointment Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-ds-dark/50 p-6 rounded-lg border border-ds-primary/20">
          <Calendar
            availableDays={[new Date()]} // Example: today is available
            bookedAppointments={appointments.map(app => app.start)}
            onDaySelect={setSelectedDate}
          />
        </div>

        <div className="bg-ds-dark/50 p-6 rounded-lg border border-ds-primary/20">
          <h2 className="text-xl font-semibold text-ds-primary mb-4">Your Appointments</h2>
          {appointments.length > 0 ? (
            appointments.map(app => (
              <div key={app.id} className="flex justify-between items-center p-4 mb-2 bg-ds-dark rounded">
                <div>
                  <p className="font-medium text-ds-text">{getDoctorFullName(app.doctor)}</p>
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
            ))
          ) : (
            <p className="text-ds-text/80">No scheduled appointments</p>
          )}
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
              <option key={doctor.uid} value={doctor.uid}>
                Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialty}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <label htmlFor="appointment-type-select" className="block text-ds-primary mb-2">Select Appointment Type:</label>
          <select
            id="appointment-type-select"
            className="block w-full p-2 border border-ds-primary rounded text-gray-800"
            value={selectedAppointmentType}
            onChange={(e) => setSelectedAppointmentType(e.target.value as 'Consultation' | 'Checkup' | 'Specialization')}
          >
            <option value="Consultation">Consultation (1 hour)</option>
            <option value="Checkup">Checkup (2 hours)</option>
            <option value="Specialization">Specialization (3 hours)</option>
          </select>
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
    </div>
  );
}