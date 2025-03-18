"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/auth-context";
import { logOut } from "@/lib/firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { Calendar, Clock, Bell, Menu, Pill, Activity, FileText, Search } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const db = getFirestore();
  const selectedDate = 15;
  
  // Calendar data (simplified)
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const dates = [
    [29, 30, 1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10, 11, 12],
    [13, 14, 15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24, 25, 26],
    [27, 28, 29, 30, 31, 1, 2]
  ];

  // Menu items
  const menuItems = [
    { name: "Dashboard", icon: <Activity size={18} />, active: true },
    { name: "Schedule", icon: <Calendar size={18} /> },
    { name: "Medications", icon: <Pill size={18} /> },
    { name: "Health Info", icon: <FileText size={18} /> },
  ];

  // Main cards
  const mainCards = [
    { 
      title: "Appointments", 
      icon: "/api/placeholder/56/56", 
      color: "bg-blue-100",
      route: "/doctors-appointments" 
    },
    { 
      title: "Tests", 
      icon: "/api/placeholder/56/56", 
      color: "bg-purple-100",
      route: "/symptom-checker" 
    },
    { 
      title: "Health Status", 
      icon: "/api/placeholder/56/56", 
      color: "bg-indigo-600",
      route: "/health-info" 
    },
  ];

  // Upcoming appointments
  const upcomingAppointments = [
    { name: "Dr. Sarah", specialty: "Cardiologist", time: "10:30 AM", avatar: "/api/placeholder/40/40" },
    { name: "Dr. Michael", specialty: "Dermatologist", time: "2:15 PM", avatar: "/api/placeholder/40/40" },
    { name: "Dr. Jessica", specialty: "Neurologist", time: "4:00 PM", avatar: "/api/placeholder/40/40" },
  ];

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

  const handleSignOut = async () => {
    try {
      await logOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white p-4 border-r border-gray-200">
        <div className="flex items-center mb-8">
          <Menu className="text-gray-500 mr-3" size={20} />
          <h1 className="text-xl font-bold">Menu</h1>
        </div>

        {/* Profile section */}
        <div className="flex items-center mb-8">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <span className="text-blue-500 font-medium">
                {user?.displayName ? user.displayName[0].toUpperCase() : 'U'}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-medium">{user?.displayName || "User"}</p>
            <p className="text-xs text-gray-500">Patient</p>
          </div>
        </div>

        {/* Menu items */}
        <div className="space-y-1">
          {menuItems.map((item, index) => (
            <div 
              key={index} 
              className={`flex items-center p-3 rounded-lg ${item.active ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}
            >
              {item.icon}
              <span className="ml-3 text-sm">{item.name}</span>
              {item.active && <div className="ml-auto w-1 h-6 bg-blue-600 rounded-full"></div>}
            </div>
          ))}
        </div>

        {/* Blue Card */}
        <div className="mt-8 bg-blue-600 rounded-lg p-4 text-white">
          <p className="text-sm font-medium mb-2">Fill your medical information</p>
          <p className="text-xs mb-4">Complete your profile to get better recommendations</p>
          <button className="text-xs bg-white text-blue-600 px-3 py-1 rounded-lg">Start</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center bg-white rounded-full px-4 py-2 border border-gray-200 w-64">
            <Search size={18} className="text-gray-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search anything..." 
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>

          <div className="flex items-center space-x-4">
            <button className="rounded-full bg-white p-2 border border-gray-200">
              <Bell size={20} className="text-gray-500" />
            </button>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="relative focus:outline-none"
            >
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-500 font-medium">
                    {user?.displayName ? user.displayName[0].toUpperCase() : 'U'}
                  </span>
                </div>
              )}
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10">
                  <Link 
                    href="/profile" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200">
              <h2 className="text-lg font-medium mb-4">Info</h2>
              
              <div className="grid grid-cols-3 gap-4">
                {mainCards.map((card, index) => (
                  <Link key={index} href={card.route}>
                    <div className={`${card.color} rounded-xl p-4 h-32 flex flex-col items-center justify-center text-center cursor-pointer transition-transform hover:scale-105`}>
                      <img src={card.icon} alt={card.title} className="mb-2 w-14 h-14" />
                      <p className={`text-sm font-medium ${card.color === "bg-indigo-600" ? "text-white" : "text-gray-800"}`}>
                        {card.title}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">My medications</h2>
                  <Link href="/medications" className="text-blue-600 text-sm font-medium">
                    +
                  </Link>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg mb-4">
                  <div className="flex justify-between mb-2">
                    <p className="text-sm font-medium">Cetirizine</p>
                    <p className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">8:00 AM</p>
                  </div>
                  <p className="text-xs text-gray-500">Antihistamine, 10mg</p>
                </div>
                
                <div className="bg-blue-600 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">Add to App</p>
                    <p className="text-white text-xs opacity-80">Scan your prescription</p>
                  </div>
                  <button className="bg-white text-blue-600 px-4 py-1 rounded-lg text-sm">Scan</button>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">View all schedule</h2>
                  <button className="text-blue-600 text-sm font-medium">→</button>
                </div>
                
                <div className="space-y-4">
                  {upcomingAppointments.map((apt, index) => (
                    <div key={index} className="flex items-center">
                      <img src={apt.avatar} alt={apt.name} className="w-10 h-10 rounded-full mr-3" />
                      <div>
                        <p className="text-sm font-medium">{apt.name}</p>
                        <p className="text-xs text-gray-500">{apt.specialty}</p>
                      </div>
                      <p className="ml-auto text-xs text-gray-700">{apt.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">July 2025</h2>
                <div className="flex space-x-2">
                  <button className="text-gray-500">←</button>
                  <button className="text-gray-500">→</button>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="grid grid-cols-7 text-center mb-2">
                  {days.map((day, i) => (
                    <div key={i} className="text-xs text-gray-500">{day}</div>
                  ))}
                </div>
                
                {dates.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 text-center mb-2">
                    {week.map((date, dateIndex) => (
                      <div 
                        key={dateIndex}
                        className={`text-xs p-2 ${
                          date === selectedDate 
                            ? 'bg-blue-600 text-white rounded-full' 
                            : date > 28 ? 'text-gray-400' : 'text-gray-800'
                        }`}
                      >
                        {date}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-gray-200 flex items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-4">
                  <Clock size={18} className="text-blue-600" />
                  <span className="text-sm text-blue-600 font-medium">12:30 PM</span>
                </div>
                <div className="mb-8">
                  <h3 className="text-base font-medium mb-1">Consultation</h3>
                  <p className="text-xs text-gray-500">30 minutes</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <p className="text-xs">Confirmed</p>
                </div>
              </div>
              <img src="/api/placeholder/120/100" alt="Doctor illustration" className="w-24" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}