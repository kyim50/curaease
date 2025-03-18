"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/auth-context";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import Nav from "../components/nav"; // Import the Nav component

export default function Home() {
  const { user } = useAuth();
  const db = getFirestore();

  // We'll actually use the profileImage in the UI now
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfileImage = async () => {
      if (!user) return;

      try {
        const profileDocRef = doc(db, 'users', user.uid);
        const profileDoc = await getDoc(profileDocRef);

        if (profileDoc.exists()) {
          const data = profileDoc.data();
          if (data.profileImageUrl) {
            setProfileImage(data.profileImageUrl);
          }
        }
      } catch (error) {
        console.error('Error loading profile image:', error);
      }
    };

    loadProfileImage();
  }, [user, db]);

  // Current month data
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  
  // Get days in current month for calendar
  const daysInMonth = new Date(currentYear, currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentDate.getMonth(), 1).getDay();
  
  // Create calendar days array
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null); // Empty cells for days before month start
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Format date to display the current month and year
  const formattedDate = new Intl.DateTimeFormat('en-US', { 
    month: 'long', 
    year: 'numeric' 
  }).format(currentDate);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar with Nav */}
        <div className="col-span-2">
          <Nav />
        </div>

        {/* Main Content */}
        <div className="col-span-7 space-y-6 p-6">
          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex space-x-6 border-b pb-3">
              <button className="text-[#00A676] font-medium pb-3 border-b-2 border-[#00A676]">Info</button>
              <button className="text-gray-500 hover:text-gray-700">Chart</button>
              <button className="text-gray-500 hover:text-gray-700">Doctor page</button>
            </div>
          </div>

          {/* Health Services Grid */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-center">
              <div className="bg-[#e6f7f1] rounded-lg p-4 mb-4">
                <span className="text-3xl">🚑</span>
              </div>
              <h3 className="text-sm font-medium text-gray-800 mb-1">My consultations</h3>
              <p className="text-xs text-gray-500">Check your upcoming consultations</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-center">
              <div className="bg-[#e6f7f1] rounded-lg p-4 mb-4">
                <span className="text-3xl">📋</span>
              </div>
              <h3 className="text-sm font-medium text-gray-800 mb-1">Tests</h3>
              <p className="text-xs text-gray-500">Access your test results</p>
            </div>
            
            <div className="bg-[#00A676] rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-center">
              <div className="bg-[#008d63] rounded-lg p-4 mb-4">
                <span className="text-3xl text-white">✚</span>
              </div>
              <h3 className="text-sm font-medium text-white mb-1">Health check</h3>
              <p className="text-xs text-[#e6f7f1]">Book your health checkup</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#e6f7f1] rounded-xl shadow-sm p-6">
              <p className="text-sm text-[#00A676] font-medium mb-6">Are you feeling unwell?</p>
              <p className="text-xs text-[#008d63] mb-4">Join our live consultation with expert doctors</p>
              <button className="bg-[#00A676] text-white text-sm px-4 py-2 rounded-lg">Join</button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-gray-800">View all schedule</h3>
                <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-xs">
                    DR
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-800">Dr. Rodriguez</p>
                    <p className="text-xs text-gray-500">Cardiologist</p>
                  </div>
                  <div className="ml-auto">
                    <p className="text-xs text-gray-500">Today</p>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold text-xs">
                    DL
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-800">Dr. Lee</p>
                    <p className="text-xs text-gray-500">Neurologist</p>
                  </div>
                  <div className="ml-auto">
                    <p className="text-xs text-gray-500">Tomrw</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="col-span-3 space-y-6 p-6">
          {/* User Profile */}
          {profileImage && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center">
                <img 
                  src={profileImage} 
                  alt="User profile" 
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium">{user?.displayName || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Calendar */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <h3 className="text-base font-medium text-gray-800">{formattedDate}</h3>
              </div>
              <div className="flex space-x-2">
                <button className="p-1 text-gray-400 hover:text-gray-800">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-800">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-xs text-center text-gray-500 font-medium">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => (
                <div 
                  key={i} 
                  className={`
                    h-8 flex items-center justify-center text-xs rounded-full
                    ${day === 15 ? 'bg-[#00A676] text-white' : day ? 'hover:bg-gray-100 text-gray-700' : ''} 
                    ${day === 18 ? 'text-[#00A676] font-bold' : ''}
                  `}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
          
          {/* Health Info Illustration */}
          <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center">
            <div className="text-center mb-4">
              <div className="inline-block bg-[#e6f7f1] rounded-full p-2 mb-2">
                <svg className="w-6 h-6 text-[#00A676]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-800">Health Tips</h3>
            </div>
            
            <div className="w-full">
              <img 
                src="/api/placeholder/250/250" 
                alt="Health illustration" 
                className="w-full object-contain"
              />
            </div>
            
            <div className="mt-4 flex space-x-2">
              <span className="inline-block bg-blue-100 rounded-full p-1">
                <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.64 13a1 1 0 00-1.14-.76 1.18 1.18 0 01-1.38-.76 1.14 1.14 0 00-2.16 0A1.11 1.11 0 0115.6 13a1 1 0 00-.76 1.13 1.12 1.12 0 01-.76 1.37 1.15 1.15 0 000 2.17 1.13 1.13 0 01.76 1.37 1 1 0 001.14.76 1.11 1.11 0 011.36.76 1.14 1.14 0 002.17 0 1.11 1.11 0 011.36-.76 1 1 0 00.76-1.14 1.13 1.13 0 01.77-1.37 1.14 1.14 0 000-2.17 1.12 1.12 0 01-.77-1.36zM17.5 16a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/>
                </svg>
              </span>
              <span className="inline-block bg-pink-100 rounded-full p-1">
                <svg className="w-4 h-4 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </span>
              <span className="inline-block bg-[#e6f7f1] rounded-full p-1">
                <svg className="w-4 h-4 text-[#00A676]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}