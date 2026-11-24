import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Evening Village Ride",
  description: "Ride a bicycle through an Indian village at golden hour and collect memories.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
