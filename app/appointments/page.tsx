'use client';
import { useState, useEffect } from 'react';
import { Calendar } from '../components/ui/calendar';
import { addHours, setHours, setMinutes, areIntervalsOverlapping, format } from 'date-fns';
import Nav from '../components/nav';
import { collection, getDocs, addDoc, serverTimestamp, query, where, doc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';

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
  doctor: string;
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

  // Authentication & data fetching effects remain unchanged
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
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
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch doctors and appointments
  useEffect(() => {
    const fetchData = async () => {
      try {
        const doctorsCollection = collection(db, 'doctors');
        const doctorSnapshot = await getDocs(doctorsCollection);
        const doctorsList = doctorSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as Doctor[];
        
        setDoctors(doctorsList);
        
        const appointmentsCollection = collection(db, 'appointments');
        const appointmentSnapshot = await getDocs(appointmentsCollection);
        const appointmentsList = appointmentSnapshot.docs.map(doc => {
          const data = doc.data();
          let startTime: Date;
          
          if (data["Appointment Time"] && typeof data["Appointment Time"].toDate === 'function') {
            startTime = data["Appointment Time"].toDate();
          } else if (data["Appointment Time"] instanceof Date) {
            startTime = data["Appointment Time"];
          } else if (typeof data["Appointment Time"] === 'string') {
            startTime = new Date(data["Appointment Time"]);
          } else {
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

  const handleCancel = async (id: string) => {
    try {
      const appointmentRef = doc(db, 'appointments', id);
      await deleteDoc(appointmentRef);
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
    let startTime = setMinutes(setHours(new Date(date), 9), 0);
    const endTime = setMinutes(setHours(new Date(date), 17), 0);

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

      startTime = addHours(startTime, 1);
    }

    return null;
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
      const patientName = `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.email;
      
      const appointmentsCollection = collection(db, 'appointments');
      const appointmentData = {
        "Appointment Date": format(availableSlot, 'yyyy-MM-dd'),
        "Appointment Time": availableSlot,
        "Appointment Type": selectedAppointmentType,
        "Createdat": serverTimestamp(),
        "Doctor": selectedDoctorId,
        "Name": patientName,
        "PatientId": currentUser.uid,
        "PatientEmail": currentUser.email
      };

      const docRef = await addDoc(appointmentsCollection, appointmentData);
      
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

  const currentMonth = selectedDate ? format(selectedDate, 'MMMM yyyy') : format(new Date(), 'MMMM yyyy');

  return (
    <div className="bg-gray-50 min-h-screen flex">
      {/* Nav sidebar */}
      <div className="w-64 fixed h-full">
        <Nav />
      </div>
      
      {/* Main content - shifted to be beside the nav */}
      <div className="ml-64 flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        </div>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="grid grid-cols-12 gap-0">
            {/* Sidebar */}
            <div className="col-span-3 border-r border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-8">
                <div className="rounded-full bg-indigo-100 p-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    {currentUser?.firstName?.charAt(0) || 'U'}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Guest'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {currentUser?.email || 'Not logged in'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center text-indigo-600 font-medium">
                  <span className="mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </span>
                  My Appointments
                </div>
                <div className="flex items-center text-gray-500">
                  <span className="mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 005 10a6 6 0 0012 0c0-.35-.03-.69-.08-1.01A5 5 0 0010 7z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Doctors
                </div>
                <div className="flex items-center text-gray-500">
                  <span className="mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1 2H8l-1-2H5V5z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Messages
                </div>
              </div>
              
              <div className="mt-12">
                <div className="bg-indigo-100 rounded-lg p-4">
                  <div className="bg-indigo-600 text-white p-3 rounded-lg mb-2">
                    <p className="text-sm">For faster responses, chat with your doctor!</p>
                    <button className="mt-2 bg-white text-indigo-600 text-xs font-medium py-1 px-3 rounded">Chat</button>
                  </div>
                  <div className="flex justify-center">
                    <img src="/img/doctor-chat.svg" alt="Chat with doctor" className="w-20 h-20" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Main content */}
            <div className="col-span-9 p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex space-x-4">
                  <button className="px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-gray-300 rounded-md">
                    Info
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md">
                    Doctor page
                  </button>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 text-gray-500 hover:text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                    </svg>
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-12 gap-6">
                {/* Left column - appointment types */}
                <div className="col-span-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">My Consultations</h2>
                  
                  {/* Card 1 */}
                  <div className="bg-indigo-50 rounded-xl p-3 mb-3 cursor-pointer transition-transform hover:scale-105">
                    <div className="p-4 flex justify-center">
                      <img 
                        src="/img/consultation.svg" 
                        alt="Consultation" 
                        className="w-16 h-16" 
                      />
                    </div>
                    <div className="text-center">
                      <h3 className="text-gray-800 font-medium text-sm">Consultation</h3>
                      <p className="text-gray-500 text-xs mt-1">1 hour session</p>
                    </div>
                  </div>
                  
                  {/* Card 2 */}
                  <div className="bg-indigo-50 rounded-xl p-3 mb-3 cursor-pointer transition-transform hover:scale-105">
                    <div className="p-4 flex justify-center">
                      <img 
                        src="/img/checkup.svg" 
                        alt="Checkup" 
                        className="w-16 h-16" 
                      />
                    </div>
                    <div className="text-center">
                      <h3 className="text-gray-800 font-medium text-sm">Checkup</h3>
                      <p className="text-gray-500 text-xs mt-1">2 hour session</p>
                    </div>
                  </div>
                  
                  {/* Card 3 */}
                  <div className="bg-indigo-600 rounded-xl p-3 cursor-pointer">
                    <div className="p-4 flex justify-center">
                      <img 
                        src="/img/specialist.svg" 
                        alt="Specialization" 
                        className="w-16 h-16" 
                      />
                    </div>
                    <div className="text-center">
                      <h3 className="text-white font-medium text-sm">Specialization</h3>
                      <p className="text-indigo-200 text-xs mt-1">3 hour session</p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Join for Our</h3>
                    <p className="text-xs text-gray-500 mb-3">Healthcare membership</p>
                    <button className="w-full bg-indigo-100 text-indigo-600 text-sm font-medium py-2 px-3 rounded-md">
                      View all schedule
                    </button>
                  </div>
                </div>
                
                {/* Right column - calendar */}
                <div className="col-span-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900">July 2025</h2>
                    <div className="flex space-x-1">
                      <button className="p-1 rounded-full bg-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button className="p-1 rounded-full bg-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {/* Calendar header */}
                    <div className="grid grid-cols-7 text-center border-b border-gray-200">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={i} className="py-2 text-sm font-medium text-gray-600">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar days */}
                    <div className="grid grid-cols-7 text-center">
                      {/* Row 1 */}
                      {[null, null, null, null, 1, 2, 3].map((day, i) => (
                        <div key={i} className={`py-3 border-b border-gray-200 ${day ? 'cursor-pointer hover:bg-gray-50' : ''}`}>
                          {day && <span className="text-sm text-gray-900">{day}</span>}
                        </div>
                      ))}
                      
                      {/* Row 2 */}
                      {[4, 5, 6, 7, 8, 9, 10].map((day, i) => (
                        <div key={i} className={`py-3 border-b border-gray-200 ${day === 6 ? 'bg-indigo-100' : ''} cursor-pointer hover:bg-gray-50`}>
                          <span className={`text-sm ${day === 6 ? 'text-indigo-600 font-medium' : 'text-gray-900'}`}>{day}</span>
                        </div>
                      ))}
                      
                      {/* Row 3 */}
                      {[11, 12, 13, 14, 15, 16, 17].map((day, i) => (
                        <div key={i} className={`py-3 border-b border-gray-200 ${day === 14 ? 'bg-indigo-600' : ''} cursor-pointer hover:bg-gray-50`}>
                          <span className={`text-sm ${day === 14 ? 'text-white font-medium' : 'text-gray-900'}`}>{day}</span>
                        </div>
                      ))}
                      
                      {/* Row 4 */}
                      {[18, 19, 20, 21, 22, 23, 24].map((day, i) => (
                        <div key={i} className="py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50">
                          <span className="text-sm text-gray-900">{day}</span>
                        </div>
                      ))}
                      
                      {/* Row 5 */}
                      {[25, 26, 27, 28, 29, 30, 31].map((day, i) => (
                        <div key={i} className="py-3 cursor-pointer hover:bg-gray-50">
                          <span className="text-sm text-gray-900">{day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Upcoming Appointments</h3>
                    
                    <div className="space-y-3">
                      {getUserAppointments().length > 0 ? (
                        getUserAppointments().slice(0, 3).map(app => (
                          <div key={app.id} className="flex items-center bg-white p-3 rounded-lg shadow-sm">
                            <div className="bg-orange-100 p-2 rounded-full mr-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">{getDoctorFullName(app.doctor)}</h4>
                              <p className="text-xs text-gray-500">{format(app.start, 'MMM d, h:mm a')} - {app.type}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-500">No upcoming appointments</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <button 
                        onClick={handleBookAppointment}
                        className="w-full bg-indigo-600 text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-indigo-700"
                        disabled={!currentUser || !selectedDoctorId || !selectedDate}
                      >
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Select a Doctor:</h2>
                <div className="grid grid-cols-3 gap-4">
                  {doctors.map(doctor => (
                    <div
                      key={doctor.uid}
                      onClick={() => setSelectedDoctorId(doctor.uid)}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        selectedDoctorId === doctor.uid ? 'bg-indigo-100 border-2 border-indigo-500' : 'bg-white border border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium mr-3">
                          {doctor.firstName.charAt(0)}{doctor.lastName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Dr. {doctor.firstName} {doctor.lastName}</h3>
                          <p className="text-xs text-gray-500">{doctor.specialty}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}