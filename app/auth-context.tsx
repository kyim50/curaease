"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { auth } from "./firebase";
import { useRouter } from "next/navigation";

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

  useEffect(() => {
    console.log("Auth state initialization started");
    // Set persistence to LOCAL to keep the user logged in
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log("Persistence set to LOCAL");
        
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          console.log("Auth state changed:", currentUser ? "User logged in" : "No user");
          setUser(currentUser);
          setLoading(false);
          
          // Create a session cookie for middleware authentication check
          if (currentUser) {
            console.log("Setting session cookie");
            document.cookie = `__session=1; path=/; max-age=2592000;`; // 30 days expiry
          } else {
            console.log("Clearing session cookie");
            document.cookie = `__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          }
        });

        return () => unsubscribe();
      })
      .catch(error => {
        console.error("Error setting persistence:", error);
        setLoading(false);
      });
  }, []);

  const signOut = async () => {
    try {
      console.log("Signing out");
      await firebaseSignOut(auth);
      // Clear the session cookie
      document.cookie = `__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      router.push("/");
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