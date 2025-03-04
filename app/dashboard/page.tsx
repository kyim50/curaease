"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, logOut } from "@/lib/firebase/auth"; // Use the existing logOut export

export default function Home() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await logOut();
      // Redirect to login page after sign out
      router.push("/login");
    } catch (error) {
      console.error("Error signing out: ", error);
      // Optionally, you could add error handling or show a toast notification
    }
  };

  return (
    <div>
      <div className="space-y-12 p-6">
        {/* Add sign-out button to the top right */}
        <div className="flex justify-end mb-4">
          <button 
            onClick={handleSignOut}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            Sign Out
          </button>
        </div>

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