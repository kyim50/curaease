"use client";
import Link from "next/link";
import { useAuth } from "@/app/auth-context";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { logOut } from "@/lib/firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export default function Nav() {
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isNavOpen, setIsNavOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
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

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <>
      {/* Toggle button - always visible */}
      <button 
        onClick={() => setIsNavOpen(!isNavOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
        aria-label={isNavOpen ? "Close navigation" : "Open navigation"}
      >
        {isNavOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="black" stroke="currentColor" strokeWidth="2">
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="black" stroke="currentColor" strokeWidth="2">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Overlay background when nav is open */}
      {isNavOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-40"
          onClick={() => setIsNavOpen(false)}
        />
      )}

      {/* Nav sidebar - fixed overlay */}
      <div 
        className={`fixed top-0 left-0 h-screen z-40 transition-transform duration-300 ease-in-out 
                  bg-white rounded-r-xl shadow-md w-64 ${isNavOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 h-full flex flex-col">
          {/* Logo at the top */}
          <div className="mb-8 text-center mt-8">
            <Link href="/dashboard" className="text-xl font-bold text-[#00A676] hover:text-[#008d63] transition-colors duration-300">
              CuraEase
            </Link>
          </div>

          {/* Navigation Menu */}
          <div className="flex-grow mb-8">
            <h2 className="text-lg font-semibold text-[#00A676] mb-4">Menu</h2>
            <div className="space-y-3">
              <Link href="/dashboard" className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${isActive('/dashboard') ? 'text-[#00A676] bg-[#e6f7f1]' : 'text-gray-600 hover:bg-[#e6f7f1]'}`}>
                <span className="w-5 h-5 mr-2">🏠</span>
                Dashboard
              </Link>
              <Link href="/appointments" className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${isActive('/appointments') ? 'text-[#00A676] bg-[#e6f7f1]' : 'text-gray-600 hover:bg-[#e6f7f1]'}`}>
                <span className="w-5 h-5 mr-2">📅</span>
                Appointments
              </Link>
              <Link href="/symptom-checker" className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${isActive('/symptom-checker') ? 'text-[#00A676] bg-[#e6f7f1]' : 'text-gray-600 hover:bg-[#e6f7f1]'}`}>
                <span className="w-5 h-5 mr-2">🔍</span>
                Symptom Checker
              </Link>
              <Link href="/health-info" className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${isActive('/health-info') ? 'text-[#00A676] bg-[#e6f7f1]' : 'text-gray-600 hover:bg-[#e6f7f1]'}`}>
                <span className="w-5 h-5 mr-2">📊</span>
                Health Info
              </Link>
              <Link href="/medications" className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${isActive('/medications') ? 'text-[#00A676] bg-[#e6f7f1]' : 'text-gray-600 hover:bg-[#e6f7f1]'}`}>
                <span className="w-5 h-5 mr-2">💊</span>
                Medications
              </Link>
            </div>
          </div>

          {/* User Profile at the bottom */}
          {user && (
            <div className="mt-auto border-t pt-4">
              <div 
                className="flex items-center p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="User Profile" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#e6f7f1] flex items-center justify-center text-[#00A676] font-bold">
                    {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div className="ml-3 flex-grow">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {user.displayName || user.email}
                  </p>
                </div>
                <svg 
                  className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              
              {dropdownOpen && (
                <div className="mt-2 bg-white rounded-lg shadow-inner border p-2 z-50">
                  <Link 
                    href="/profile" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#e6f7f1] rounded-md"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md mt-1"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}