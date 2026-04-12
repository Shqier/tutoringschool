'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error?.message ?? 'Invalid email or password');
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--busala-bg-primary, #0B0D10)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-8 shadow-lg"
        style={{
          background: 'var(--busala-glass-bg, rgba(255,255,255,0.04))',
          borderColor: 'var(--busala-border-glass)',
          backdropFilter: 'blur(var(--busala-glass-blur, 12px))',
        }}
      >
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
            style={{ background: 'var(--busala-gold, #F5A623)' }}
          >
            <span className="text-xl font-bold text-black">B</span>
          </div>
          <h1
            className="text-2xl font-semibold"
            style={{ color: 'var(--busala-text-primary)' }}
          >
            Welcome back
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--busala-text-muted)' }}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" style={{ color: 'var(--busala-text-secondary)' }}>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" style={{ color: 'var(--busala-text-secondary)' }}>
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            className="w-full font-semibold"
            disabled={loading}
            style={{
              background: 'var(--busala-gold, #F5A623)',
              color: '#000',
              boxShadow: 'var(--busala-shadow-button)',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}
