'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, User, Mail, ArrowRight, CheckCircle2, GraduationCap, Eye, EyeOff, Lock, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

type SubdomainStatus = 'idle' | 'checking' | 'available' | 'taken' | 'reserved' | 'invalid';

interface SubdomainCheckResult {
  available: boolean;
  error?: string;
  subdomain: string;
}

/**
 * Signup Page
 * Organization registration with custom auth
 */
export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Real-time subdomain check state
  const [subdomainStatus, setSubdomainStatus] = useState<SubdomainStatus>('idle');
  const [subdomainMessage, setSubdomainMessage] = useState<string>('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [formData, setFormData] = useState({
    orgName: '',
    subdomain: '',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    password: '',
    confirmPassword: '',
  });

  // Debounced subdomain check
  const checkSubdomain = useCallback(async (subdomain: string) => {
    if (!subdomain || subdomain.length < 2) {
      setSubdomainStatus('idle');
      setSubdomainMessage('');
      return;
    }

    // Validate format first
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      setSubdomainStatus('invalid');
      setSubdomainMessage('Only lowercase letters, numbers, and hyphens allowed');
      return;
    }

    setSubdomainStatus('checking');
    setSubdomainMessage('Checking availability...');

    try {
      const response = await fetch(`/api/tenants/check-subdomain?subdomain=${subdomain}`);
      const data: SubdomainCheckResult = await response.json();

      if (!response.ok || !data.available) {
        if (data.error?.includes('reserved')) {
          setSubdomainStatus('reserved');
          setSubdomainMessage('This subdomain is reserved');
        } else {
          setSubdomainStatus('taken');
          setSubdomainMessage(data.error || 'This subdomain is already taken');
        }
      } else {
        setSubdomainStatus('available');
        setSubdomainMessage('This subdomain is available!');
      }
    } catch (err) {
      setSubdomainStatus('idle');
      setSubdomainMessage('');
    }
  }, []);

  // Watch subdomain changes and debounce the check
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (formData.subdomain.length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        checkSubdomain(formData.subdomain);
      }, 500); // 500ms debounce
    } else {
      setSubdomainStatus('idle');
      setSubdomainMessage('');
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [formData.subdomain, checkSubdomain]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const generateSubdomain = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleOrgNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const newSubdomain = generateSubdomain(name);
    setFormData((prev) => ({
      ...prev,
      orgName: name,
      subdomain: newSubdomain,
    }));
    // Reset status when generating new subdomain
    setSubdomainStatus('idle');
    setSubdomainMessage('');
  };

  const validateStep = () => {
    setError(null);
    
    if (step === 1) {
      if (!formData.orgName.trim()) {
        setError('Organization name is required');
        return false;
      }
      if (!formData.subdomain.trim()) {
        setError('Subdomain is required');
        return false;
      }
      if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
        setError('Subdomain can only contain lowercase letters, numbers, and hyphens');
        return false;
      }
      if (subdomainStatus === 'taken' || subdomainStatus === 'reserved') {
        setError('Please choose a different subdomain');
        return false;
      }
    }
    
    if (step === 2) {
      if (!formData.adminName.trim()) {
        setError('Your name is required');
        return false;
      }
      if (!formData.adminEmail.trim()) {
        setError('Email is required');
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
        setError('Please enter a valid email address');
        return false;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      // Check password strength
      if (!/[A-Z]/.test(formData.password)) {
        setError('Password must contain at least one uppercase letter');
        return false;
      }
      if (!/[a-z]/.test(formData.password)) {
        setError('Password must contain at least one lowercase letter');
        return false;
      }
      if (!/[0-9]/.test(formData.password)) {
        setError('Password must contain at least one number');
        return false;
      }
    }
    
    return true;
  };

  const handleContinue = () => {
    if (!validateStep()) return;
    
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSignup();
    }
  };

  const handleSignup = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Signup in progress
      
      // Create tenant and user
      const response = await fetch('/api/onboarding/create-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant: {
            name: formData.orgName,
            subdomain: formData.subdomain,
            email: formData.adminEmail,
          },
          owner: {
            name: formData.adminName,
            email: formData.adminEmail,
            phone: formData.adminPhone || undefined,
            password: formData.password,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || 'Failed to create account. Please try again.');
        setIsLoading(false);
        return;
      }

      // Redirect to dashboard
      // Note: Cross-subdomain cookies don't work on localhost easily
      // In production, this would redirect to the tenant subdomain
      router.push('/dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const getSubdomainStatusColor = () => {
    switch (subdomainStatus) {
      case 'available':
        return 'text-emerald-400';
      case 'taken':
      case 'reserved':
      case 'invalid':
        return 'text-red-400';
      case 'checking':
        return 'text-gray-400';
      default:
        return 'text-gray-500';
    }
  };

  const getSubdomainIcon = () => {
    switch (subdomainStatus) {
      case 'available':
        return <Check className="w-5 h-5 text-emerald-400" />;
      case 'taken':
      case 'reserved':
      case 'invalid':
        return <X className="w-5 h-5 text-red-400" />;
      case 'checking':
        return <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />;
      default:
        return null;
    }
  };

  const steps = [
    {
      icon: Building2,
      title: 'Organization',
      description: 'Tell us about your school',
    },
    {
      icon: User,
      title: 'Admin Account',
      description: 'Create your account',
    },
    {
      icon: CheckCircle2,
      title: 'Get Started',
      description: 'Review and complete',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0B0D10]">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5A623] to-[#D4891A] flex items-center justify-center shadow-lg shadow-[#F5A623]/20">
            <GraduationCap className="w-7 h-7 text-[#0B0D10]" />
          </div>
          <span className="text-white text-2xl font-semibold">ClassHub</span>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((s, index) => (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    index + 1 <= step
                      ? 'bg-gradient-to-r from-[#F5A623] to-[#D4891A] text-[#0B0D10]'
                      : 'bg-gray-800 text-gray-500'
                  }`}
                >
                  <s.icon className="w-5 h-5" />
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    index + 1 <= step ? 'text-[#F5A623]' : 'text-gray-500'
                  }`}
                >
                  Step {index + 1}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-20 h-0.5 mx-2 transition-all duration-300 ${
                    index + 1 < step ? 'bg-[#F5A623]' : 'bg-gray-800'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-950/50 border-red-800 text-red-200">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Card */}
        <div className="bg-[#151921] rounded-2xl border border-gray-800 p-8 shadow-2xl">
          {/* Step 1: Organization */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">
                  {steps[0].title}
                </h1>
                <p className="text-gray-400">{steps[0].description}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName" className="text-gray-300">
                    School / Organization Name *
                  </Label>
                  <Input
                    id="orgName"
                    name="orgName"
                    value={formData.orgName}
                    onChange={handleOrgNameChange}
                    placeholder="e.g., Al-Barakah Arabic School"
                    className="bg-[#0B0D10] border-gray-700 text-white placeholder:text-gray-600 focus:border-[#F5A623] focus:ring-[#F5A623]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subdomain" className="text-gray-300">
                    Your Subdomain *
                  </Label>
                  <div className="flex items-center">
                    <div className="relative flex-1">
                      <Input
                        id="subdomain"
                        name="subdomain"
                        value={formData.subdomain}
                        onChange={handleInputChange}
                        placeholder="your-school"
                        className={`bg-[#0B0D10] border-gray-700 text-white placeholder:text-gray-600 focus:border-[#F5A623] focus:ring-[#F5A623]/20 rounded-r-none pr-10 ${
                          subdomainStatus === 'available' ? 'border-emerald-500/50 focus:border-emerald-500' :
                          subdomainStatus === 'taken' || subdomainStatus === 'reserved' || subdomainStatus === 'invalid' ? 'border-red-500/50 focus:border-red-500' : ''
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {getSubdomainIcon()}
                      </div>
                    </div>
                    <span className="px-4 py-2 bg-gray-800 border border-l-0 border-gray-700 text-gray-400 rounded-r-lg whitespace-nowrap">
                      .classhub.io
                    </span>
                  </div>
                  
                  {/* Real-time status message */}
                  {subdomainMessage && (
                    <p className={`text-sm ${getSubdomainStatusColor()} transition-colors duration-200`}>
                      {subdomainMessage}
                    </p>
                  )}
                  
                  {/* Preview URL */}
                  {formData.subdomain && subdomainStatus === 'available' && (
                    <p className="text-sm text-gray-500">
                      Your URL will be:{' '}
                      <span className="text-[#F5A623]">
                        https://{formData.subdomain}.classhub.io
                      </span>
                    </p>
                  )}
                  
                  {!subdomainMessage && (
                    <p className="text-xs text-gray-500">
                      Use lowercase letters, numbers, and hyphens only (min 2 characters).
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-lg bg-[#F5A623]/5 border border-[#F5A623]/20">
                  <p className="text-sm text-[#F5A623]">
                    <strong>Tip:</strong> You&apos;ll be able to invite teachers and staff after setting up your account.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Admin Account */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">
                  {steps[1].title}
                </h1>
                <p className="text-gray-400">{steps[1].description}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminName" className="text-gray-300">
                    Your Full Name *
                  </Label>
                  <Input
                    id="adminName"
                    name="adminName"
                    value={formData.adminName}
                    onChange={handleInputChange}
                    placeholder="e.g., Ahmed Hassan"
                    className="bg-[#0B0D10] border-gray-700 text-white placeholder:text-gray-600 focus:border-[#F5A623] focus:ring-[#F5A623]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail" className="text-gray-300">
                    Email Address *
                  </Label>
                  <Input
                    id="adminEmail"
                    name="adminEmail"
                    type="email"
                    value={formData.adminEmail}
                    onChange={handleInputChange}
                    placeholder="admin@yourschool.com"
                    className="bg-[#0B0D10] border-gray-700 text-white placeholder:text-gray-600 focus:border-[#F5A623] focus:ring-[#F5A623]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPhone" className="text-gray-300">
                    Phone Number (optional)
                  </Label>
                  <Input
                    id="adminPhone"
                    name="adminPhone"
                    type="tel"
                    value={formData.adminPhone}
                    onChange={handleInputChange}
                    placeholder="+1 234 567 890"
                    className="bg-[#0B0D10] border-gray-700 text-white placeholder:text-gray-600 focus:border-[#F5A623] focus:ring-[#F5A623]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300">
                    Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Create a strong password"
                      className="bg-[#0B0D10] border-gray-700 text-white placeholder:text-gray-600 focus:border-[#F5A623] focus:ring-[#F5A623]/20 pr-10"
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-300">
                    Confirm Password *
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    className="bg-[#0B0D10] border-gray-700 text-white placeholder:text-gray-600 focus:border-[#F5A623] focus:ring-[#F5A623]/20"
                  />
                </div>

                <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <p className="text-sm text-blue-400">
                    <Lock className="w-4 h-4 inline mr-2" />
                    <strong>Security:</strong> Password must be at least 8 characters with uppercase, lowercase, and numbers.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">
                  {steps[2].title}
                </h1>
                <p className="text-gray-400">{steps[2].description}</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-[#0B0D10] border border-gray-800 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                    Organization Details
                  </h3>
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-[#F5A623]" />
                    <div>
                      <p className="text-sm text-gray-500">Organization</p>
                      <p className="text-white font-medium">{formData.orgName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#F5A623]" />
                    <div>
                      <p className="text-sm text-gray-500">Your URL</p>
                      <p className="text-white font-medium">https://{formData.subdomain}.classhub.io</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[#0B0D10] border border-gray-800 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                    Administrator
                  </h3>
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-[#F5A623]" />
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="text-white font-medium">{formData.adminName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#F5A623]" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-white font-medium">{formData.adminEmail}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-sm text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 inline mr-2" />
                    By completing setup, you agree to create a 14-day free trial. No credit card required.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800">
            <Button
              variant="ghost"
              onClick={() => step > 1 && setStep(step - 1)}
              disabled={step === 1 || isLoading}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              Back
            </Button>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                Already have an account?{' '}
                <a href="/login" className="text-[#F5A623] hover:underline">
                  Sign in
                </a>
              </span>

              <Button
                onClick={handleContinue}
                disabled={isLoading || (step === 1 && (subdomainStatus === 'checking' || subdomainStatus === 'taken' || subdomainStatus === 'reserved' || subdomainStatus === 'invalid'))}
                className="bg-gradient-to-r from-[#F5A623] to-[#D4891A] hover:opacity-90 text-[#0B0D10] font-semibold px-6"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {step === 3 ? 'Complete Setup' : 'Continue'}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">
          By signing up, you agree to our{' '}
          <a href="#" className="text-[#F5A623] hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-[#F5A623] hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
