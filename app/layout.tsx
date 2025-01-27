// app/layout.tsx
import Link from 'next/link';
// app/layout.tsx
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-ds-dark text-ds-text font-sans">
        <div className="min-h-full flex flex-col">
          <header className="bg-ds-dark border-b border-ds-primary/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <h1 className="text-2xl font-bold text-ds-primary">CuraEasE</h1>
                <nav className="flex space-x-8">
                  <Link 
                    href="/appointments" 
                    className="text-ds-text hover:text-ds-primary transition-colors"
                  >
                    Appointments
                  </Link>
                  <Link
                    href="/symptom-checker"
                    className="text-ds-text hover:text-ds-primary transition-colors"
                  >
                    Symptom Checker
                  </Link>
                  <Link
                    href="/health-info"
                    className="text-ds-text hover:text-ds-primary transition-colors"
                  >
                    Health Info
                  </Link>
                  <Link
                    href="/medications"
                    className="text-ds-text hover:text-ds-primary transition-colors"
                  >
                    Medications
                  </Link>
                </nav>
              </div>
            </div>
          </header>

          <main className="flex-1">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>

          <footer className="bg-ds-dark border-t border-ds-primary/20 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <p className="text-center text-ds-text/80">
                © {new Date().getFullYear()} CuraEasE. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}