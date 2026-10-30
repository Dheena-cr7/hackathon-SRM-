import './globals.css';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'CampusOps — Intelligent Campus Operations Platform',
  description: 'Incident intake, automated triage, technician dispatch, disruption relocation, and 3D digital twin.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#0D0D0D] text-white antialiased selection:bg-[#BFF549] selection:text-black">
        {/* Skip to Content for WCAG Accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-[#BFF549] focus:text-black focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold focus:shadow-xl focus:outline-none"
        >
          Skip to main content
        </a>

        <Navbar />

        <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        <footer className="border-t border-white/[0.08] bg-[#0D0D0D] py-6 text-xs text-white/50 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="font-semibold text-white">CampusOps Platform</span>
              <span className="mx-2 text-white/20">•</span>
              <span>Sri Krishna Institutions</span>
              <span className="mx-2 text-white/20">•</span>
              <span className="text-white/60">Sri Krishna Campus</span>
            </div>
            <div className="flex items-center space-x-3 text-white/50">
              <span>Map & Building Geometry © OpenStreetMap contributors (ODbL 1.0)</span>
              <span className="text-white/20">•</span>
              <span className="text-[#BFF549] font-semibold flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#BFF549] inline-block shadow-[0_0_6px_#BFF549]" />
                <span>100% Offline Verified</span>
              </span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
