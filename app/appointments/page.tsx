'use client';
import { useState, useEffect } from 'react';
import { Calendar } from '../components/ui/calendar';
import { addHours, setHours, setMinutes, areIntervalsOverlapping, format } from 'date-fns';
import Nav from '../components/nav';
import { collection, getDocs, addDoc, serverTimestamp, query, where, doc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase'; // Adjust this import based on your Firebase config path

interface Doctor {
  uid: string;
  firstName: string;
  lastName: string;
  specialty: string;
  email: string;
}

interface User {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Appointment {
  id: string;
  doctor: string; // This holds the doctor's UID
  patient: string;
  patientId: string;
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Check authentication and fetch user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Query Firestore to get additional user data
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('uid', '==', user.uid));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data() as User;
            setCurrentUser({
              uid: user.uid,
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              email: user.email || userData.email || ''
            });
          } else {
            // If no user document found, create a minimal user object
            setCurrentUser({
              uid: user.uid,
              firstName: user.displayName?.split(' ')[0] || '',
              lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
              email: user.email || ''
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setCurrentUser(null);
        // Optional: redirect to login page if not logged in
        // window.location.href = '/login';
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch doctors and appointments from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch doctors
        const doctorsCollection = collection(db, 'doctors');
        const doctorSnapshot = await getDocs(doctorsCollection);
        const doctorsList = doctorSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as Doctor[];
        
        setDoctors(doctorsList);
        
        // Fetch appointments
        const appointmentsCollection = collection(db, 'appointments');
        const appointmentSnapshot = await getDocs(appointmentsCollection);
        const appointmentsList = appointmentSnapshot.docs.map(doc => {
          const data = doc.data();
          // Safely handle timestamps or date strings
          let startTime: Date;
          
          // Check if Appointment Time is a Firestore Timestamp
          if (data["Appointment Time"] && typeof data["Appointment Time"].toDate === 'function') {
            startTime = data["Appointment Time"].toDate();
          } else if (data["Appointment Time"] instanceof Date) {
            startTime = data["Appointment Time"];
          } else if (typeof data["Appointment Time"] === 'string') {
            startTime = new Date(data["Appointment Time"]);
          } else {
            console.warn('Invalid appointment time format:', data["Appointment Time"]);
            startTime = new Date();
          }
          
          const appointmentType = data["Appointment Type"] as 'Consultation' | 'Checkup' | 'Specialization';
          const duration = appointmentDurations[appointmentType] || 1;

          return {
            id: doc.id,
            doctor: data.Doctor || '',
            patient: data.Name || 'Unknown Patient',
            patientId: data.PatientId || '',
            start: startTime,
            end: addHours(startTime, duration),
            type: appointmentType || 'Consultation'
          };
        });
        
        setAppointments(appointmentsList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Then update the handleCancel function
const handleCancel = async (id: string) => {
  try {
    // Delete from Firestore
    const appointmentRef = doc(db, 'appointments', id);
    await deleteDoc(appointmentRef);
    
    // Then update the UI
    setAppointments(appointments.filter(a => a.id !== id));
    
    alert("Appointment successfully cancelled");
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    alert("Failed to cancel appointment. Please try again.");
  }
};

  const getDoctorAppointments = (doctorId: string, date: Date): Appointment[] => {
    return appointments.filter(app => 
      app.doctor === doctorId && 
      app.start.getFullYear() === date.getFullYear() &&
      app.start.getMonth() === date.getMonth() &&
      app.start.getDate() === date.getDate()
    );
  };

  const getUserAppointments = (): Appointment[] => {
    if (!currentUser) return [];
    return appointments.filter(app => app.patientId === currentUser.uid);
  };

  const findAvailableSlot = (doctorId: string, date: Date, duration: number): Date | null => {
    const doctorAppointments = getDoctorAppointments(doctorId, date);
    let startTime = setMinutes(setHours(new Date(date), 9), 0); // Start at 9 AM
    const endTime = setMinutes(setHours(new Date(date), 17), 0); // End at 5 PM

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

  const handleBookAppointment = async () => {
    if (!currentUser) {
      alert("You must be logged in to book an appointment.");
      return;
    }

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

    try {
      // Get patient's full name from current user
      const patientName = `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.email;
      
      // Create the appointment in Firestore with the specified fields
      const appointmentsCollection = collection(db, 'appointments');
      const appointmentData = {
        "Appointment Date": format(availableSlot, 'yyyy-MM-dd'),
        "Appointment Time": availableSlot, // Firestore will convert this to Timestamp
        "Appointment Type": selectedAppointmentType,
        "Createdat": serverTimestamp(),
        "Doctor": selectedDoctorId,
        "Name": patientName,
        "PatientId": currentUser.uid,
        "PatientEmail": currentUser.email
      };

      const docRef = await addDoc(appointmentsCollection, appointmentData);
      
      // Add the appointment to the local state
      const newAppointment: Appointment = {
        id: docRef.id,
        doctor: selectedDoctorId,
        patient: patientName,
        patientId: currentUser.uid,
        start: availableSlot,
        end: addHours(availableSlot, duration),
        type: selectedAppointmentType
      };

      setAppointments([...appointments, newAppointment]);
      alert("Appointment successfully booked!");
    } catch (error) {
      console.error("Error adding appointment to Firestore:", error);
      alert("Failed to book appointment. Please try again.");
    }
  };

  const getDoctorFullName = (doctorId: string) => {
    const doctor = doctors.find(d => d.uid === doctorId);
    return doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : "Unknown Doctor";
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading doctors and appointments...</div>;
  }

  return (
    <div>
    <Nav />
    <div className="space-y-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-ds-primary">Appointment Management</h1>
      
      {!currentUser ? (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p>Please log in to book appointments.</p>
        </div>
      ) : (
        <div className="bg-ds-dark/50 p-4 rounded-lg border border-ds-primary/20 mb-4">
          <p className="text-ds-text">Logged in as: <span className="font-semibold">{currentUser.firstName} {currentUser.lastName}</span></p>
        </div>
      )}
      
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
          {currentUser ? (
            getUserAppointments().length > 0 ? (
              getUserAppointments().map(app => (
                <div key={app.id} className="flex justify-between items-center p-4 mb-2 bg-ds-dark rounded">
                  <div>
                    <p className="font-medium text-ds-text">{getDoctorFullName(app.doctor)}</p>
                    <p className="text-sm text-ds-text/80">
                      {app.start.toLocaleDateString()} {app.start.toLocaleTimeString()}
                    </p>
                    <p className="text-sm text-ds-text/80">Type: {app.type}</p>
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
            )
          ) : (
            <p className="text-ds-text/80">Log in to view your appointments</p>
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
            disabled={!currentUser}
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
            disabled={!currentUser}
          >
            <option value="Consultation">Consultation (1 hour)</option>
            <option value="Checkup">Checkup (2 hours)</option>
            <option value="Specialization">Specialization (3 hours)</option>
          </select>
        </div>

        <div className="mt-4">
          <button
            onClick={handleBookAppointment}
            className="w-full bg-ds-primary text-white p-2 rounded-md hover:bg-ds-primary/80 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={!currentUser}
          >
            Book Appointment
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}