'use client';
import { useState, useEffect } from 'react';
import { Calendar } from '../components/ui/calendar';
import { addHours, format, parseISO } from 'date-fns';
import Nav from '../components/nav';
import { collection, getDocs, query, where, doc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';

interface Doctor {
  uid: string;
  firstName: string;
  lastName: string;
  specialty: string;
  email: string;
}

interface Patient {
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
  patientEmail: string;
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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<Doctor | null>(null);
  const [isDoctor, setIsDoctor] = useState<boolean>(false);

  // Check authentication and fetch user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if user is a doctor
          const doctorsRef = collection(db, 'doctors');
          const doctorQuery = query(doctorsRef, where('uid', '==', user.uid));
          const doctorSnapshot = await getDocs(doctorQuery);
          
          if (!doctorSnapshot.empty) {
            const doctorData = doctorSnapshot.docs[0].data() as Doctor;
            setCurrentUser({
              uid: user.uid,
              firstName: doctorData.firstName || '',
              lastName: doctorData.lastName || '',
              specialty: doctorData.specialty || '',
              email: user.email || doctorData.email || ''
            });
            setIsDoctor(true);
          } else {
            // User is not a doctor
            setIsDoctor(false);
            setCurrentUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setCurrentUser(null);
        setIsDoctor(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch appointments and patients from Firestore
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !isDoctor) {
        setLoading(false);
        return;
      }

      try {
        // Fetch patients for reference
        const patientsCollection = collection(db, 'patients');
        const patientSnapshot = await getDocs(patientsCollection);
        const patientsList = patientSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as Patient[];
        
        setPatients(patientsList);
        
        // Fetch appointments for the current doctor
        const appointmentsCollection = collection(db, 'appointments');
        const doctorAppointmentsQuery = query(appointmentsCollection, where('Doctor', '==', currentUser.uid));
        const appointmentSnapshot = await getDocs(doctorAppointmentsQuery);
        
        const appointmentsList = appointmentSnapshot.docs.map(doc => {
          const data = doc.data();
          // Safely handle timestamps or date strings
          let startTime: Date;
          
          if (data["Appointment Time"] && typeof data["Appointment Time"].toDate === 'function') {
            startTime = data["Appointment Time"].toDate();
          } else if (data["Appointment Time"] instanceof Date) {
            startTime = data["Appointment Time"];
          } else if (typeof data["Appointment Time"] === 'string') {
            startTime = new Date(data["Appointment Time"]);
          } else if (data["Appointment Date"] && typeof data["Appointment Date"] === 'string') {
            // If we have a separate date string, parse it
            startTime = parseISO(data["Appointment Date"]);
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
            patientEmail: data.PatientEmail || '',
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
  }, [currentUser, isDoctor]);

  const handleCancelAppointment = async (id: string) => {
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

  const getDoctorAppointments = (date: Date): Appointment[] => {
    if (!currentUser) return [];
    
    return appointments.filter(app => 
      app.start.getFullYear() === date.getFullYear() &&
      app.start.getMonth() === date.getMonth() &&
      app.start.getDate() === date.getDate()
    );
  };

  const getPatientDetails = (patientId: string): Patient | undefined => {
    return patients.find(p => p.uid === patientId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <Nav />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ds-primary"></div>
          <span className="ml-3">Loading appointments...</span>
        </div>
      </div>
    );
  }

  if (!isDoctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <Nav />
        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-red-900/50 border-l-4 border-red-500 p-6 rounded-lg mb-4">
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p>Only doctors can access this page. Please log in with a doctor account.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Nav />
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-ds-primary">My Patient Appointments</h1>
          <div className="px-4 py-2 bg-ds-primary/20 rounded-lg border border-ds-primary/30">
            <p className="text-ds-primary">
              <span className="font-semibold">Dr. {currentUser?.firstName} {currentUser?.lastName}</span>
              <span className="text-sm ml-2 opacity-80">{currentUser?.specialty}</span>
            </p>
          </div>
        </div>
      
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 bg-ds-dark/70 p-6 rounded-lg border border-ds-primary/20 shadow-lg">
            <h2 className="text-xl font-semibold text-ds-primary mb-4">Calendar</h2>
            <div className="rounded-md border border-ds-primary/20 bg-ds-dark/50 p-3">
              <Calendar
                availableDays={[new Date()]}
                bookedAppointments={appointments.map(app => app.start)}
                onDaySelect={setSelectedDate}
              />
            </div>
            
            <div className="mt-6 p-4 bg-ds-primary/10 rounded-lg border border-ds-primary/20">
              <h3 className="font-medium text-ds-primary mb-2">Selected Date</h3>
              <p className="text-lg">{selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'No date selected'}</p>
              <p className="text-sm mt-2 opacity-80">
                {selectedDate ? 
                  `${getDoctorAppointments(selectedDate).length} appointments scheduled` : 
                  'Select a date to view appointments'}
              </p>
            </div>
          </div>

          <div className="md:col-span-2 bg-ds-dark/70 p-6 rounded-lg border border-ds-primary/20 shadow-lg">
            <h2 className="text-xl font-semibold text-ds-primary mb-4">
              Appointments for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Today'}
            </h2>
            
            {getDoctorAppointments(selectedDate || new Date()).length > 0 ? (
              <div className="space-y-4">
                {getDoctorAppointments(selectedDate || new Date()).map(app => {
                  const patient = getPatientDetails(app.patientId);
                  return (
                    <div key={app.id} className="p-4 bg-ds-dark/90 rounded-lg border border-ds-primary/10 hover:border-ds-primary/30 transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{app.patient}</h3>
                          <p className="text-sm text-ds-text/70">{app.patientEmail}</p>
                          
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-3">
                            <div>
                              <p className="text-xs text-ds-text/60">Appointment Type</p>
                              <p className="font-medium">
                                <span 
                                  className={`inline-block px-2 py-1 rounded-md text-xs ${
                                    app.type === 'Consultation' ? 'bg-blue-500/20 text-blue-300' : 
                                    app.type === 'Checkup' ? 'bg-green-500/20 text-green-300' : 
                                    'bg-purple-500/20 text-purple-300'
                                  }`}
                                >
                                  {app.type}
                                </span>
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-xs text-ds-text/60">Duration</p>
                              <p className="font-medium">{appointmentDurations[app.type]} hour{appointmentDurations[app.type] > 1 ? 's' : ''}</p>
                            </div>
                            
                            <div>
                              <p className="text-xs text-ds-text/60">Time</p>
                              <p className="font-medium">{format(app.start, 'h:mm a')} - {format(app.end, 'h:mm a')}</p>
                            </div>
                            
                            {patient && (
                              <div>
                                <p className="text-xs text-ds-text/60">Patient ID</p>
                                <p className="font-medium text-sm">{patient.uid.substring(0, 8)}...</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => handleCancelAppointment(app.id)}
                          className="px-3 py-1.5 bg-red-900/30 text-red-300 rounded hover:bg-red-900/50 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-ds-dark/50 rounded-lg border border-dashed border-ds-primary/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-ds-primary/40 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-ds-text/60">No appointments scheduled for this date</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-ds-dark/70 p-6 rounded-lg border border-ds-primary/20 shadow-lg">
          <h2 className="text-xl font-semibold text-ds-primary mb-4">All Upcoming Appointments</h2>
          
          {appointments.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-ds-primary/20">
              <table className="min-w-full divide-y divide-ds-primary/10">
                <thead className="bg-ds-primary/10">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-ds-primary uppercase tracking-wider">Patient</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-ds-primary uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-ds-primary uppercase tracking-wider">Time</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-ds-primary uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-ds-primary uppercase tracking-wider">Duration</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-ds-primary uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-ds-dark/50 divide-y divide-ds-primary/10">
                  {appointments.sort((a, b) => a.start.getTime() - b.start.getTime()).map((app) => (
                    <tr key={app.id} className="hover:bg-ds-primary/5">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">{app.patient}</div>
                        <div className="text-xs text-ds-text/60">{app.patientEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {format(app.start, 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {format(app.start, 'h:mm a')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${app.type === 'Consultation' ? 'bg-blue-900/30 text-blue-300' : 
                          app.type === 'Checkup' ? 'bg-green-900/30 text-green-300' : 
                          'bg-purple-900/30 text-purple-300'}`}>
                          {app.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {appointmentDurations[app.type]} hour{appointmentDurations[app.type] > 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button 
                          onClick={() => handleCancelAppointment(app.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-ds-text/60">
              No upcoming appointments scheduled
            </div>
          )}
        </div>
      </div>
    </div>
  );
}