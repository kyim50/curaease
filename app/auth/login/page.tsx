// app/auth/login/page.tsx
import Link from "next/link";
import { LandingNav } from "@/app/components/LandingNav";

export default function Login() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />
      
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md border border-gray-200">
          <h1 className="text-2xl font-bold text-[#00A676] mb-6 text-center">Log in to CuraEase</h1>
          
          <form className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00A676]"
                placeholder="you@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00A676]"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 text-[#00A676] focus:ring-[#00A676] border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                  Remember me
                </label>
              </div>
              
              <a href="#" className="text-sm text-[#00A676] hover:text-[#008c63]">
                Forgot password?
              </a>
            </div>
            
            <button
              type="submit"
              className="w-full bg-[#00A676] text-white py-2 px-4 rounded-md hover:bg-[#008c63] focus:outline-none focus:ring-2 focus:ring-[#00A676] focus:ring-offset-2"
            >
              Log In
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-[#00A676] hover:text-[#008c63]">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}