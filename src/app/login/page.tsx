'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, GraduationCap, Users, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Login Page
 * Public landing page for authentication
 */
export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  // Check if already logged in
  useEffect(() => {
    // Check for auth cookie
    const hasSession = document.cookie.includes('appSession');
    if (hasSession) {
      router.push('/');
    }
  }, [router]);

  const handleLogin = () => {
    setIsLoading(true);
    window.location.href = '/api/auth/login';
  };

  const features = [
    {
      icon: Users,
      title: 'Manage Teachers & Students',
      description: 'Organize your school community in one place',
    },
    {
      icon: Calendar,
      title: 'Smart Scheduling',
      description: 'Automatic conflict detection and availability management',
    },
    {
      icon: GraduationCap,
      title: 'Track Progress',
      description: 'Monitor attendance, performance, and growth',
    },
    {
      icon: BookOpen,
      title: 'Lesson Management',
      description: 'Plan, schedule, and manage lessons efficiently',
    },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-12 bg-[#0B0D10]">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5A623] to-[#D4891A] flex items-center justify-center shadow-lg shadow-[#F5A623]/20">
              <span className="text-[#0B0D10] font-bold text-2xl">B</span>
            </div>
            <span className="text-white text-2xl font-semibold">Busala</span>
          </div>

          {/* Welcome Text */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-white">Welcome back</h1>
            <p className="text-gray-400">Sign in to manage your school</p>
          </div>

          {/* Login Button */}
          <div className="space-y-4">
            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-[#F5A623] to-[#D4891A] hover:opacity-90 text-[#0B0D10] font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-[#F5A623]/20"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign in with Auth0
                  <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </Button>

            <p className="text-center text-sm text-gray-500">
              Secure authentication powered by Auth0
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#0B0D10] text-gray-500">School Management System</span>
            </div>
          </div>

          {/* Footer Links */}
          <div className="flex justify-center gap-6 text-sm">
            <a href="#" className="text-gray-500 hover:text-[#F5A623] transition-colors">
              Help Center
            </a>
            <a href="#" className="text-gray-500 hover:text-[#F5A623] transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-500 hover:text-[#F5A623] transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>

      {/* Right Side - Features Showcase */}
      <div className="hidden lg:flex flex-1 flex-col justify-center p-12 bg-gradient-to-br from-[#151921] to-[#0B0D10] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-[#F5A623]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#F5A623]/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl font-bold text-white mb-6">
            Manage Your School{' '}
            <span className="bg-gradient-to-r from-[#F5A623] to-[#D4891A] bg-clip-text text-transparent">
              Efficiently
            </span>
          </h2>
          <p className="text-gray-400 text-lg mb-12">
            Streamline your school operations with our comprehensive management platform.
          </p>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl bg-[#1A1D26]/50 border border-gray-800/50 hover:border-[#F5A623]/30 transition-all duration-300 group"
              >
                <div className="p-3 rounded-lg bg-[#F5A623]/10 group-hover:bg-[#F5A623]/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-[#F5A623]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6 pt-8 border-t border-gray-800">
            <div>
              <div className="text-3xl font-bold text-white">500+</div>
              <div className="text-gray-500 text-sm">Schools</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">10k+</div>
              <div className="text-gray-500 text-sm">Teachers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">50k+</div>
              <div className="text-gray-500 text-sm">Students</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
