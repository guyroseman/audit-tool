import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexus | Free Website Revenue Audit",
  description:
    "Find out exactly how much revenue your slow website is costing you. Nexus gives you a free, instant performance diagnostic in 60 seconds.",
  openGraph: {
    title: "Is Your Website Bleeding Revenue? | Nexus",
    description: "Free 60-second diagnostic reveals the exact dollar cost of your site's performance issues.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
