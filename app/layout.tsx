// app/layout.tsx
import { AuthProvider } from "./auth-context";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CuraEase",
  description: "Healthcare management made easy"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}