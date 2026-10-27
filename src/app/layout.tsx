import type { Metadata } from "next";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import QueryProvider from "../components/layouts/QueryProvider";

export const metadata: Metadata = {
  title: {
    default: "Waka Line Admin",
    template: "%s | Waka Line Admin",
  },
  description: "Waka Line Logistics administration panel.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <QueryProvider>
          {children}
          <ToastContainer theme="colored" />
        </QueryProvider>
      </body>
    </html>
  );
}
