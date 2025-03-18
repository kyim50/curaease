"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signOut as firebaseSignOut
} from "firebase/auth";
import { auth } from "./firebase";
import { useRouter, usePathname } from "next/navigation";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      // Redirect logic with more strict conditions
      if (currentUser) {
        // If user is on login or signup page and authenticated, redirect to dashboard
        if (pathname === '/auth/login' || pathname === '/auth/signup') {
          router.push('/login');
        }
      } else {
        // If user is not authenticated and tries to access protected routes, redirect to login
        if (pathname === '/dashboard') {
          router.push('/auth/login');
        }
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      router.push("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}