'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, User, Mail, ArrowRight, CheckCircle2, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Signup Page
 * Organization registration page
 */
export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    orgName: '',
    adminName: '',
    adminEmail: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleContinue = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSignup();
    }
  };

  const handleSignup = () => {
    setIsLoading(true);
    // For now, redirect to Auth0 login
    // In production, this would create the org first, then redirect
    window.location.href = '/api/auth/login';
  };

  const steps = [
    {
      icon: Building2,
      title: 'Organization Details',
      description: 'Tell us about your school',
    },
    {
      icon: User,
      title: 'Admin Account',
      description: 'Create your administrator account',
    },
    {
      icon: CheckCircle2,
      title: 'Get Started',
      description: 'Start managing your school',
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
          <span className="text-white text-2xl font-semibold">Busala</span>
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
                    School / Organization Name
                  </Label>
                  <Input
                    id="orgName"
                    name="orgName"
                    value={formData.orgName}
                    onChange={handleInputChange}
                    placeholder="e.g., Al-Barakah Arabic School"
                    className="bg-[#0B0D10] border-gray-700 text-white placeholder:text-gray-600 focus:border-[#F5A623] focus:ring-[#F5A623]/20"
                  />
                </div>

                <div className="p-4 rounded-lg bg-[#F5A623]/5 border border-[#F5A623]/20">
                  <p className="text-sm text-[#F5A623]">
                    <strong>Tip:</strong> You'll be able to invite teachers and staff after setting up your account.
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
                    Your Full Name
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
                    Email Address
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

                <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <p className="text-sm text-blue-400">
                    <strong>Note:</strong> You'll use Auth0 for secure authentication. We never store your passwords.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Get Started */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">
                  {steps[2].title}
                </h1>
                <p className="text-gray-400">{steps[2].description}</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-[#0B0D10] border border-gray-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-[#F5A623]" />
                    <div>
                      <p className="text-sm text-gray-500">Organization</p>
                      <p className="text-white font-medium">{formData.orgName || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-[#F5A623]" />
                    <div>
                      <p className="text-sm text-gray-500">Administrator</p>
                      <p className="text-white font-medium">{formData.adminName || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#F5A623]" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-white font-medium">{formData.adminEmail || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-sm text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 inline mr-2" />
                    You'll be redirected to Auth0 to complete secure authentication.
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
                disabled={isLoading}
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
