// components/LandingNav.tsx
import Link from "next/link";

export function LandingNav() {
  return (
    <nav className="bg-white border-b border-gray-200 p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-[#00A676] hover:text-[#008c63]">
          CuraEase
        </Link>
        <div className="flex space-x-6">
          <Link href="/about" className="text-gray-600 hover:text-[#00A676]">
            About
          </Link>
          <Link href="/features" className="text-gray-600 hover:text-[#00A676]">
            Features
          </Link>
          <Link href="/contact" className="text-gray-600 hover:text-[#00A676]">
            Contact
          </Link>
          <Link href="/auth/login" className="text-[#00A676] font-medium hover:text-[#008c63]">
            Log In
          </Link>
        </div>
      </div>
    </nav>
  );
}