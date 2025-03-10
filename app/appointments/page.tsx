'use client';
import { useState, useEffect } from 'react';
import { Calendar } from '../components/ui/calendar';
import { addHours, setHours, setMinutes, areIntervalsOverlapping, format, parse } from 'date-fns';
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
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAppointmentType, setSelectedAppointmentType] = useState<'Consultation' | 'Checkup' | 'Specialization'>('Consultation');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  
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
        setFilteredDoctors(doctorsList);
        
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

  // Filter doctors when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      // Limit to 5 doctors
      setFilteredDoctors(doctors.slice(0, 5));
    } else {
      const filtered = doctors.filter(doctor => {
        const fullName = `${doctor.firstName} ${doctor.lastName}`.toLowerCase();
        const specialty = doctor.specialty.toLowerCase();
        const term = searchTerm.toLowerCase();
        return fullName.includes(term) || specialty.includes(term);
      }).slice(0, 5); // Limit to 5 filtered doctors
      setFilteredDoctors(filtered);
    }
  }, [searchTerm, doctors]);

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
  
  // Generate days for the calendar
  const generateCalendarDays = () => {
    if (!selectedDate) return [];
    
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Create calendar grid
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };
  
  const handleDateSelection = (day: number) => {
    if (!selectedDate || day === null) return;
    
    const newDate = new Date(selectedDate);
    newDate.setDate(day);
    setSelectedDate(newDate);
  };
  
  const handleNextMonth = () => {
    if (!selectedDate) return;
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };
  
  const handlePreviousMonth = () => {
    if (!selectedDate) return;
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctorId(doctor.uid);
    setIsDropdownOpen(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading doctors and appointments...</div>;
  }

  const calendarDays = generateCalendarDays();
  const currentMonth = selectedDate ? format(selectedDate, 'MMMM yyyy') : format(new Date(), 'MMMM yyyy');
  const selectedDay = selectedDate ? selectedDate.getDate() : null;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Nav sidebar */}
      <div className="fixed h-full">
        <Nav />
      </div>
      
      {/* Main content - taking up required width */}
      <div className="ml-16 p-4 max-w-full">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        </div>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="grid grid-cols-12 gap-0">
            {/* Sidebar - now with upcoming appointments */}
            <div className="col-span-2 border-r border-gray-200 p-4">
              <div className="flex items-center space-x-2 mb-6">
                <div className="rounded-full bg-green-100 p-1">
                  <div className="w-6 h-6 rounded-full bg-[#00A676] text-white flex items-center justify-center">
                    {currentUser?.firstName?.charAt(0) || 'U'}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">
                    {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Guest'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {currentUser?.email || 'Not logged in'}
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Upcoming Appointments</h3>
                
                <div className="space-y-3">
                  {getUserAppointments().length > 0 ? (
                    getUserAppointments().slice(0, 5).map(app => (
                      <div key={app.id} className="bg-white p-3 rounded-lg shadow border border-gray-100 text-xs flex flex-col justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{getDoctorFullName(app.doctor)}</h4>
                          <p className="text-gray-500">{format(app.start, 'MMM d, h:mm a')}</p>
                          <p className="text-gray-500">{app.type}</p>
                        </div>
                        <button 
                          onClick={() => handleCancel(app.id)}
                          className="mt-2 bg-red-500 text-white py-1 px-2 rounded text-xs hover:bg-red-600 transition-colors w-full text-center"
                        >
                          Cancel
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">No upcoming appointments</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Main content */}
            <div className="col-span-10 p-4">
              <div className="grid grid-cols-12 gap-4">
                {/* Doctor selection column on the left */}
                <div className="col-span-3">
                  <h2 className="text-md font-medium text-gray-900 mb-3">Select a Doctor</h2>
                  
                  {/* Doctor search input */}
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Search doctors..."
                      className="w-full p-2 text-sm border border-gray-200 rounded-md"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  {/* Doctor list - limited to 5 doctors */}
                  <div className="bg-white border border-gray-200 rounded-lg h-60 overflow-y-auto">
                    {filteredDoctors.length > 0 ? (
                      filteredDoctors.map(doctor => (
                        <div
                          key={doctor.uid}
                          className={`p-3 cursor-pointer hover:bg-gray-50 flex items-center border-b border-gray-100 ${selectedDoctorId === doctor.uid ? 'bg-green-50 border-l-4 border-l-[#00A676]' : ''}`}
                          onClick={() => setSelectedDoctorId(doctor.uid)}
                        >
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-[#00A676] font-medium mr-2 text-xs">
                            {doctor.firstName.charAt(0)}{doctor.lastName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-xs font-medium text-gray-900">Dr. {doctor.firstName} {doctor.lastName}</h3>
                            <p className="text-xs text-gray-500">{doctor.specialty}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500 text-sm">
                        No doctors found
                      </div>
                    )}
                  </div>
                  
                  <h2 className="text-md font-medium text-gray-900 mt-6 mb-3">My Consultations</h2>
                  
                  {/* Consultation types - now wider and evenly sized */}
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {/* Card 1 */}
                    <div 
                      className={`${selectedAppointmentType === 'Consultation' ? 'bg-[#00A676]' : 'bg-green-50'} rounded-xl p-2 cursor-pointer flex flex-col items-center justify-center h-24 ${selectedAppointmentType === 'Consultation' ? 'ring-2 ring-[#00A676]' : ''}`}
                      onClick={() => setSelectedAppointmentType('Consultation')}
                    >
                      <div className="flex items-center justify-center">
                        <img 
                          src="/img/consultation.svg" 
                          alt="Consultation" 
                          className="w-8 h-8" 
                        />
                      </div>
                      <div className="text-center mt-2">
                        <h3 className={`${selectedAppointmentType === 'Consultation' ? 'text-white' : 'text-gray-800'} font-medium text-xs`}>Consultation</h3>
                        <p className={`${selectedAppointmentType === 'Consultation' ? 'text-green-200' : 'text-gray-500'} text-xs`}>1h</p>
                      </div>
                    </div>
                    
                    {/* Card 2 */}
                    <div 
                      className={`${selectedAppointmentType === 'Checkup' ? 'bg-[#00A676]' : 'bg-green-50'} rounded-xl p-2 cursor-pointer flex flex-col items-center justify-center h-24 ${selectedAppointmentType === 'Checkup' ? 'ring-2 ring-[#00A676]' : ''}`}
                      onClick={() => setSelectedAppointmentType('Checkup')}
                    >
                      <div className="flex items-center justify-center">
                        <img 
                          src="/img/checkup.svg" 
                          alt="Checkup" 
                          className="w-8 h-8" 
                        />
                      </div>
                      <div className="text-center mt-2">
                        <h3 className={`${selectedAppointmentType === 'Checkup' ? 'text-white' : 'text-gray-800'} font-medium text-xs`}>Checkup</h3>
                        <p className={`${selectedAppointmentType === 'Checkup' ? 'text-green-200' : 'text-gray-500'} text-xs`}>2h</p>
                      </div>
                    </div>
                    
                    {/* Card 3 */}
                    <div 
                      className={`${selectedAppointmentType === 'Specialization' ? 'bg-[#00A676]' : 'bg-green-50'} rounded-xl p-2 cursor-pointer flex flex-col items-center justify-center h-24 ${selectedAppointmentType === 'Specialization' ? 'ring-2 ring-[#00A676]' : ''}`}
                      onClick={() => setSelectedAppointmentType('Specialization')}
                    >
                      <div className="flex items-center justify-center">
                        <img 
                          src="/img/specialist.svg" 
                          alt="Specialization" 
                          className="w-8 h-8" 
                        />
                      </div>
                      <div className="text-center mt-2">
                        <h3 className={`${selectedAppointmentType === 'Specialization' ? 'text-white' : 'text-gray-800'} font-medium text-xs`}>Specialist</h3>
                        <p className={`${selectedAppointmentType === 'Specialization' ? 'text-green-200' : 'text-gray-500'} text-xs`}>3h</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right column - calendar */}
                <div className="col-span-9">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-md font-medium text-gray-900">{currentMonth}</h2>
                    <div className="flex space-x-1">
                      <button 
                        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                        onClick={handlePreviousMonth}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button 
                        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                        onClick={handleNextMonth}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {/* Calendar header */}
                    <div className="grid grid-cols-7 text-center border-b border-gray-200">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={i} className="py-1 text-xs font-medium text-gray-600">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar days */}
                    <div className="grid grid-cols-7 text-center">
                      {calendarDays.map((day, i) => (
                        <div 
                          key={i} 
                          className={`py-2 ${i < calendarDays.length - 7 ? 'border-b border-gray-200' : ''} ${
                            day ? 'cursor-pointer hover:bg-gray-50' : ''
                          } ${
                            day === selectedDay ? 'bg-[#00A676]' : day ? 'bg-white' : 'bg-gray-50'
                          }`}
                          onClick={() => day && handleDateSelection(day)}
                        >
                          {day && (
                            <span className={`text-xs ${
                              day === selectedDay ? 'text-white font-medium' : 'text-gray-900'
                            }`}>
                              {day}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <button 
                      onClick={handleBookAppointment}
                      className="w-full bg-[#00A676] text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-[#008d64]"
                      disabled={!currentUser || !selectedDoctorId || !selectedDate}
                    >
                      Book Appointment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}