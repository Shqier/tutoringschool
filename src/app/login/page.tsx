'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate auth delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    toast.success('Welcome back!');
    setIsLoading(false);
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0D10] px-4">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#F5A623]/[0.03] blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl busala-gradient-gold flex items-center justify-center mb-3 shadow-lg shadow-[#F5A623]/20">
            <span className="text-[#0B0D10] font-bold text-xl">B</span>
          </div>
          <span className="text-white text-xl font-semibold tracking-tight">Busala</span>
        </div>

        {/* Card */}
        <div className="busala-card p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-white mb-1">Welcome Back</h1>
            <p className="text-sm text-busala-text-subtle">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-busala-text-muted">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-busala-text-subtle" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 bg-[#0B0D10]/50 border-busala-border-glass text-white placeholder:text-busala-text-subtle focus:border-[#F5A623]/40 focus:ring-[#F5A623]/20"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-busala-text-muted">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-busala-text-subtle" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-10 bg-[#0B0D10]/50 border-busala-border-glass text-white placeholder:text-busala-text-subtle focus:border-[#F5A623]/40 focus:ring-[#F5A623]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-busala-text-subtle hover:text-busala-text-muted transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-busala-border-glass bg-[#0B0D10]/50 text-[#F5A623] focus:ring-[#F5A623]/20 accent-[#F5A623]"
                />
                <span className="text-sm text-busala-text-subtle">Remember me</span>
              </label>
              <button type="button" className="text-sm text-[#F5A623] hover:text-[#FFD07A] transition-colors">
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 busala-gradient-gold text-[#0B0D10] font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-[#F5A623]/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Sign up link */}
          <p className="mt-6 text-center text-sm text-busala-text-subtle">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#F5A623] hover:text-[#FFD07A] transition-colors font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
