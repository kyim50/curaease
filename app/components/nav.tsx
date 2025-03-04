// components/Nav.tsx
import Link from "next/link";

export default function Nav() {
  return (
    <nav className="bg-[#00A676] border-b border-ds-primary/20 p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-bold text-white hover:text-white/90 hover:scale-110 transition-transform duration-500">
          CuraEase
        </Link>
        <div className="flex space-x-6">
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
      </div>
    </nav>
  );
}