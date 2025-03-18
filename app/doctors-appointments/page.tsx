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
      <div className="min-h-screen bg-white">
        <Nav />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-700">Loading appointments...</span>
        </div>
      </div>
    );
  }

  if (!isDoctor) {
    return (
      <div className="min-h-screen bg-white">
        <Nav />
        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-red-100 border-l-4 border-red-500 p-6 rounded-lg mb-4">
            <h1 className="text-2xl font-bold mb-2 text-gray-800">Access Denied</h1>
            <p className="text-gray-700">Only doctors can access this page. Please log in with a doctor account.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-indigo-600 rounded-full mr-2 flex items-center justify-center">
              <span className="text-white text-sm">{currentUser?.firstName?.charAt(0)}{currentUser?.lastName?.charAt(0)}</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-800">Doctor Appointment</h1>
          </div>
          <div className="flex space-x-4">
            <div className="px-3 py-1 bg-gray-100 rounded-md text-sm text-gray-600">Info</div>
            <div className="px-3 py-1 bg-indigo-100 rounded-md text-sm text-indigo-600">Doctor page</div>
          </div>
        </div>
      
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-medium text-gray-800 mb-4">July 2025</h2>
              <div className="rounded-md">
                <Calendar
                  availableDays={[new Date()]}
                  bookedAppointments={appointments.map(app => app.start)}
                  onDaySelect={setSelectedDate}
                />
              </div>
              
              <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
                <h3 className="font-medium text-indigo-700 mb-2">Selected Date</h3>
                <p className="text-gray-800">{selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'No date selected'}</p>
                <p className="text-sm mt-2 text-gray-600">
                  {selectedDate ? 
                    `${getDoctorAppointments(selectedDate).length} appointments scheduled` : 
                    'Select a date to view appointments'}
                </p>
              </div>
            </div>

            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-800">My schedule</h2>
                <button className="text-indigo-600 text-sm flex items-center">
                  View all schedule <span className="ml-1">→</span>
                </button>
              </div>
              
              {getDoctorAppointments(selectedDate || new Date()).slice(0, 3).map((app) => (
                <div key={app.id} className="flex items-center mb-3 p-2 hover:bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                    <span className="text-xs text-indigo-600">{app.patient.substring(0, 2)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{app.patient}</p>
                    <p className="text-xs text-gray-500">{format(app.start, 'h:mm a')}</p>
                  </div>
                </div>
              ))}
              
              {getDoctorAppointments(selectedDate || new Date()).length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No appointments for today
                </div>
              )}
            </div>
          </div>

          <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">
              Appointments for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Today'}
            </h2>
            
            {getDoctorAppointments(selectedDate || new Date()).length > 0 ? (
              <div className="space-y-4">
                {getDoctorAppointments(selectedDate || new Date()).map(app => {
                  const patient = getPatientDetails(app.patientId);
                  return (
                    <div key={app.id} className="p-4 bg-white rounded-lg border border-gray-100 hover:border-indigo-200 transition-all shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex">
                          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center mr-4">
                            <span className="text-indigo-600 font-medium">{app.patient.substring(0, 2)}</span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-800">{app.patient}</h3>
                            <p className="text-sm text-gray-500">{app.patientEmail}</p>
                            
                            <div className="grid grid-cols-2 gap-4 mt-3">
                              <div>
                                <p className="text-xs text-gray-500">Appointment Type</p>
                                <p className="font-medium text-gray-700">
                                  <span 
                                    className={`inline-block px-2 py-1 rounded-md text-xs ${
                                      app.type === 'Consultation' ? 'bg-blue-100 text-blue-600' : 
                                      app.type === 'Checkup' ? 'bg-green-100 text-green-600' : 
                                      'bg-purple-100 text-purple-600'
                                    }`}
                                  >
                                    {app.type}
                                  </span>
                                </p>
                              </div>
                              
                              <div>
                                <p className="text-xs text-gray-500">Duration</p>
                                <p className="font-medium text-gray-700">{appointmentDurations[app.type]} hour{appointmentDurations[app.type] > 1 ? 's' : ''}</p>
                              </div>
                              
                              <div>
                                <p className="text-xs text-gray-500">Time</p>
                                <p className="font-medium text-gray-700">{format(app.start, 'h:mm a')} - {format(app.end, 'h:mm a')}</p>
                              </div>
                              
                              {patient && (
                                <div>
                                  <p className="text-xs text-gray-500">Patient ID</p>
                                  <p className="font-medium text-gray-700 text-sm">{patient.uid.substring(0, 8)}...</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => handleCancelAppointment(app.id)}
                          className="px-3 py-1.5 border border-red-200 text-red-500 rounded-md hover:bg-red-50 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500">No appointments scheduled for this date</p>
                <p className="text-sm text-gray-400 mt-1">Select another date or wait for new bookings</p>
              </div>
            )}
            
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-800">All Upcoming Appointments</h3>
              </div>
              
              {appointments.length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {appointments.sort((a, b) => a.start.getTime() - b.start.getTime()).slice(0, 5).map((app) => (
                        <tr key={app.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                                <span className="text-xs text-indigo-600">{app.patient.substring(0, 2)}</span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-800">{app.patient}</div>
                                <div className="text-xs text-gray-500">{app.patientEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {format(app.start, 'MMM d, yyyy')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {format(app.start, 'h:mm a')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full 
                              ${app.type === 'Consultation' ? 'bg-blue-100 text-blue-600' : 
                              app.type === 'Checkup' ? 'bg-green-100 text-green-600' : 
                              'bg-purple-100 text-purple-600'}`}>
                              {app.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <button 
                              onClick={() => handleCancelAppointment(app.id)}
                              className="text-red-500 hover:text-red-700"
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
                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                  No upcoming appointments scheduled
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}