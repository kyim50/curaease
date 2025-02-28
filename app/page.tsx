"use client";
import Link from "next/link";
import { LandingNav } from "./components/LandingNav";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-white to-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Welcome to <span className="text-[#00A676]">CuraEase</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The smart healthcare management platform that simplifies your medical journey.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="px-8 py-3 bg-[#00A676] text-white font-medium rounded-md hover:bg-[#008c63] transition-colors">
              Get Started
            </Link>
            <Link href="/auth/login" className="px-8 py-3 border border-[#00A676] text-[#00A676] font-medium rounded-md hover:bg-[#f0fdf9] transition-colors">
              Log In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}