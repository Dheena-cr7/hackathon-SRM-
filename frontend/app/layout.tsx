import './globals.css';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'CampusOps — Zero-Cost Intelligent Operations Platform',
  description: 'Multi-channel incident intake, automated triage, disruption management, and 3D campus digital twin.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="font-semibold text-slate-300">CampusOps</span> — Zero-Cost Intelligent Campus Operations Platform
              <span className="mx-2">•</span>
              <span>SRM Institute of Science & Technology</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Map & Building Data © OpenStreetMap contributors (ODbL 1.0)</span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">100% Offline Verified</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

