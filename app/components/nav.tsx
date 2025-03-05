"use client";
import Link from "next/link";
import { useAuth } from "@/app/auth-context";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { logOut } from "@/lib/firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export default function Nav() {
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const router = useRouter();
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
    <nav className="bg-[#00A676] border-b border-ds-primary/20 p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-bold text-white hover:text-white/90 hover:scale-110 transition-transform duration-500">
          CuraEase
        </Link>
        <div className="flex items-center space-x-6">
          <div className="flex space-x-6 mr-4">
            <Link href="/appointments" className="text-ds-text hover:text-ds-primary">
              Appointments
            </Link>
            <Link href="/symptom-checker" className="text-ds-text hover:text-ds-primary">
              Symptom Checker
            </Link>
            <Link href="/health-info" className="text-ds-text hover:text-ds-primary">
              Health Info
            </Link>
            <Link href="/medications" className="text-ds-text hover:text-ds-primary">
              Medications
            </Link>
          </div>
          
          {user && (
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="User Profile" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white font-bold">
                    {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                  </div>
                )}
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-700">
                      {user.displayName || user.email}
                    </div>
                    <Link 
                      href="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}