import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Busala - School Management System',
  description: 'Streamline your school operations with our comprehensive management platform',
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0B0D10]">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0B0D10]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F5A623] to-[#D4891A] flex items-center justify-center">
                <span className="text-[#0B0D10] font-bold">B</span>
              </div>
              <span className="text-white font-semibold text-xl">Busala</span>
            </Link>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/features" className="text-gray-400 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                Contact
              </Link>
            </nav>

            {/* CTA */}
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-gray-400 hover:text-white transition-colors hidden sm:block">
                Sign in
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-[#F5A623] to-[#D4891A] text-[#0B0D10] hover:opacity-90">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0B0D10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F5A623] to-[#D4891A] flex items-center justify-center">
                  <span className="text-[#0B0D10] font-bold">B</span>
                </div>
                <span className="text-white font-semibold text-xl">Busala</span>
              </Link>
              <p className="text-gray-400 text-sm max-w-xs">
                Streamline your school operations with our comprehensive management platform.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-gray-400 hover:text-white text-sm">Features</Link></li>
                <li><Link href="/pricing" className="text-gray-400 hover:text-white text-sm">Pricing</Link></li>
                <li><Link href="/signup" className="text-gray-400 hover:text-white text-sm">Get Started</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-gray-400 hover:text-white text-sm">Contact</Link></li>
                <li><Link href="/login" className="text-gray-400 hover:text-white text-sm">Sign In</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Busala. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-gray-500 hover:text-white text-sm">Privacy</Link>
              <Link href="#" className="text-gray-500 hover:text-white text-sm">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
