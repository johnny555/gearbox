import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gearbox Analyzer - Drivetrain Simulation Tool",
  description: "Visual drivetrain analysis tool for comparing diesel vs eCVT configurations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
