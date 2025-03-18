"use client";
import Link from "next/link";
import { LandingNav } from "@/app/components/LandingNav";
import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from "firebase/auth";
import { auth, firestore } from "@/app/firebase"; // Add db import
import { doc, setDoc } from "firebase/firestore"; // Import Firestore methods
import { useRouter } from "next/navigation";

export default function SignUp() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validate form
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (!agreeTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy");
      return;
    }
    
    setLoading(true);
    
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with name
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`
      });
      
      // Create a user document in Firestore
      await setDoc(doc(firestore, 'users', user.uid), {
        uid: user.uid,
        firstName,
        lastName,
        email,
        role: 'patient',
        createdAt: new Date()
      });
      
      router.push("/login"); // Redirect to dashboard after successful signup
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof Error) {
        setError(error.message || "Failed to create account");
      } else {
        setError("Failed to create account");
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignUp = async () => {
    if (!agreeTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy");
      return;
    }
    
    setError("");
    setLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Extract name parts from displayName
      const nameParts = user.displayName?.split(' ') || ['', ''];
      const gFirstName = nameParts[0] || '';
      // Join all remaining parts as lastName (handles middle names)
      const gLastName = nameParts.slice(1).join(' ') || '';
      
      // Create a user document in Firestore for Google sign-ins
      await setDoc(doc(firestore, 'users', user.uid), {
        uid: user.uid,
        firstName: gFirstName,
        lastName: gLastName,
        email: user.email,
        role: 'patient',
        createdAt: new Date()
      });
      
      router.push("/login"); 
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof Error) {
        setError(error.message || "Failed to sign up with Google");
      } else {
        setError("Failed to sign up with Google");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />
      
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md border border-gray-200">
          <h1 className="text-2xl font-bold text-[#00A676] mb-6 text-center">Create an Account</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleEmailSignUp}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00A676] text-black"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00A676] text-black"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            
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
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00A676] text-black"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00A676] text-black"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            
            <div className="flex items-center">
              <input
                id="terms"
                type="checkbox"
                className="h-4 w-4 text-[#00A676] focus:ring-[#00A676] border-gray-300 rounded"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                I agree to the{" "}
                <a href="#" className="text-[#00A676] hover:text-[#008c63]">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-[#00A676] hover:text-[#008c63]">
                  Privacy Policy
                </a>
              </label>
            </div>
            
            <button
              type="submit"
              className="w-full bg-[#00A676] text-white py-2 px-4 rounded-md hover:bg-[#008c63] focus:outline-none focus:ring-2 focus:ring-[#00A676] focus:ring-offset-2 flex justify-center"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleSignUp}
                className="w-full flex justify-center items-center gap-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#00A676]"
                disabled={loading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                  <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                </svg>
                Sign up with Google
              </button>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-[#00A676] hover:text-[#008c63]">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}