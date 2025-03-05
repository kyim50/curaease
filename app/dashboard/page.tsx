"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/auth-context";
import { logOut } from "@/lib/firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const db = getFirestore();

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
    <div>
      <div className="space-y-12 p-6">
        {/* User Profile Dropdown in Top Right */}
        <div className="absolute top-6 right-6">
          {user && (
            <div className="relative">
              <div className="flex items-center space-x-4">
                {dropdownOpen && (
                  <div 
                    className="bg-white rounded-lg shadow-lg py-1 mr-2 transition-all duration-300 ease-in-out"
                    style={{
                      opacity: dropdownOpen ? 1 : 0,
                      transform: dropdownOpen ? 'translateX(0)' : 'translateX(10px)',
                      visibility: dropdownOpen ? 'visible' : 'hidden'
                    }}
                  >
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
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="focus:outline-none"
                >
                  {profileImage ? (
                    <img 
                      src={profileImage} 
                      alt="User Profile" 
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#00A676] flex items-center justify-center text-white font-bold text-2xl">
                      {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Centered Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-[#00A676]">Welcome to CuraEase</h1>
          <p className="text-xl text-[#00A676]">
            Your intelligent healthcare companion
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link 
            href="/appointments" 
            className="bg-[#00A676] border border-ds-primary/20 rounded-lg p-6 hover:border-ds-primary transition-all hover:scale-[1.02]"
          >
            <h3 className="text-xl font-semibold text-white mb-2">Appointments</h3>
            <p className="text-ds-text/80">Schedule and manage your medical appointments</p>
          </Link>

          <Link 
            href="/symptom-checker" 
            className="bg-[#00A676] border border-ds-primary/20 rounded-lg p-6 hover:border-ds-primary transition-all hover:scale-[1.02]"
          >
            <h3 className="text-xl font-semibold text-white mb-2">Symptom Checker</h3>
            <p className="text-ds-text/80">Get preliminary assessment of your symptoms</p>
          </Link>

          <Link 
            href="/health-info" 
            className="bg-[#00A676] border border-ds-primary/20 rounded-lg p-6 hover:border-ds-primary transition-all hover:scale-[1.02]"
          >
            <h3 className="text-xl font-semibold text-white mb-2">Health Info</h3>
            <p className="text-ds-text/80">Access trusted medical information</p>
          </Link>

          <Link 
            href="/medications" 
            className="bg-[#00A676] border border-ds-primary/20 rounded-lg p-6 hover:border-ds-primary transition-all hover:scale-[1.02]"
          >
            <h3 className="text-xl font-semibold text-white mb-2">Medications</h3>
            <p className="text-ds-text/80">Manage your medication schedule</p>
          </Link>
        </div>

        <div className="bg-[#00A676] border border-ds-primary/20 rounded-lg p-6 mt-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-ds-dark/50 rounded">
              <span className="text-ds-text/80">Upcoming appointment</span>
              <span className="text-white">Tomorrow 10:00 AM</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-ds-dark/50 rounded">
              <span className="text-ds-text/80">Medication due</span>
              <span className="text-white">In 2 hours</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}