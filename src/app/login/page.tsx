'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, GraduationCap, Users, Calendar, ArrowRight, Eye, EyeOff, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Login Page Wrapper
 * Wraps the login form in a Suspense boundary for useSearchParams
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0D10]">
      <div className="animate-pulse">
        <div className="w-12 h-12 rounded-xl bg-[#F5A623]/20 mb-8 mx-auto"></div>
        <div className="h-8 w-48 bg-gray-800 rounded mb-4 mx-auto"></div>
        <div className="h-4 w-64 bg-gray-800 rounded mx-auto"></div>
      </div>
    </div>
  );
}

/**
 * Login Page Content
 * Supports email/password, phone/password, Google OAuth, and Apple OAuth
 */
function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');

  // Check for errors in URL
  useEffect(() => {
    const errorCode = searchParams.get('error');
    if (errorCode) {
      const errorMessages: Record<string, string> = {
        'oauth_cancelled': 'Login was cancelled. Please try again.',
        'oauth_failed': 'Social login failed. Please try again or use email/password.',
        'oauth_not_configured': 'Social login is not configured. Please use email/password.',
        'invalid_state': 'Invalid session state. Please try again.',
        'account_inactive': 'Your account has been deactivated. Please contact support.',
        'multiple_tenants': 'Multiple organizations found. Please contact support.',
      };
      setError(errorMessages[errorCode] || 'An error occurred. Please try again.');
    }
  }, [searchParams]);

  // Check if already logged in
  useEffect(() => {
    const hasSession = document.cookie.includes('busala_session');
    if (hasSession) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(loginMethod === 'email' ? { email } : { phone }),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.code === 'MULTIPLE_TENANTS') {
          setError('Multiple organizations found for this email. Please specify which one to use.');
        } else if (data.error?.code === 'OAUTH_ONLY') {
          setError(data.error.message);
        } else {
          setError(data.error?.message || 'Invalid credentials');
        }
        return;
      }

      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    window.location.href = '/api/auth/google';
  };

  const handleAppleLogin = () => {
    setIsLoading(true);
    window.location.href = '/api/auth/apple';
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
            <span className="text-white text-2xl font-semibold">ClassHub</span>
          </div>

          {/* Welcome Text */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-white">Welcome back</h1>
            <p className="text-gray-400">Sign in to manage your school</p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="bg-red-950/50 border-red-800 text-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <Tabs value={loginMethod} onValueChange={(v) => setLoginMethod(v as 'email' | 'phone')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#1A1D26]">
                <TabsTrigger value="email" className="data-[state=active]:bg-[#F5A623] data-[state=active]:text-[#0B0D10]">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="phone" className="data-[state=active]:bg-[#F5A623] data-[state=active]:text-[#0B0D10]">
                  <Phone className="w-4 h-4 mr-2" />
                  Phone
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@school.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-[#1A1D26] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#F5A623] focus:ring-[#F5A623]/20"
                  />
                </div>
              </TabsContent>

              <TabsContent value="phone" className="mt-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-300">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 234 567 890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="h-12 bg-[#1A1D26] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#F5A623] focus:ring-[#F5A623]/20"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 bg-[#1A1D26] border-gray-700 text-white placeholder:text-gray-500 focus:border-[#F5A623] focus:ring-[#F5A623]/20 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-600 bg-[#1A1D26] text-[#F5A623] focus:ring-[#F5A623]" />
                Remember me
              </label>
              <a href="#" className="text-[#F5A623] hover:underline">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-[#F5A623] to-[#D4891A] hover:opacity-90 text-[#0B0D10] font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-[#F5A623]/20"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign in
                  <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#0B0D10] text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="h-12 bg-[#1A1D26] border-gray-700 text-white hover:bg-[#252836] hover:text-white"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleAppleLogin}
              disabled={isLoading}
              className="h-12 bg-[#1A1D26] border-gray-700 text-white hover:bg-[#252836] hover:text-white"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.22 7.13-.57 1.5-1.31 2.99-2.27 4.08zm-5.85-15.1c.07-2.04 1.76-3.79 3.78-3.94.29 2.32-1.93 4.48-3.78 3.94z"/>
              </svg>
              Apple
            </Button>
          </div>

          {/* Sign up link */}
          <p className="text-center text-gray-400">
            New to ClassHub?{' '}
            <a href="/signup" className="text-[#F5A623] hover:underline font-medium">
              Sign up
            </a>
          </p>

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
