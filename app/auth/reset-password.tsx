"use client";
import Link from "next/link";
import { LandingNav } from "@/app/components/LandingNav";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/app/firebase";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (error: any) {
      console.error(error);
      setError(error.message || "Failed to send password reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />
      
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md border border-gray-200">
          <h1 className="text-2xl font-bold text-[#00A676] mb-6 text-center">Reset Password</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {success ? (
            <div className="text-center space-y-6">
              <div className="p-3 bg-green-50 text-green-600 rounded-md">
                Password reset email sent. Please check your inbox and follow the instructions.
              </div>
              <Link href="/auth/login" className="block text-[#00A676] hover:text-[#008c63]">
                Return to login
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleResetPassword}>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                <input
                  id="email"
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00A676] text-black"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-[#00A676] text-white py-2 px-4 rounded-md hover:bg-[#008c63] focus:outline-none focus:ring-2 focus:ring-[#00A676] focus:ring-offset-2 flex justify-center"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
              
              <div className="text-center">
                <Link href="/auth/login" className="text-sm text-[#00A676] hover:text-[#008c63]">
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}