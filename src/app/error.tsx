'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0D10]">
      <div className="text-center px-6">
        <div className="mb-6">
          <span className="text-8xl font-bold bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent">
            500
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2">Something Went Wrong</h1>
        <p className="text-white/60 mb-8 max-w-md mx-auto">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium text-[#0B0D10] transition-opacity hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, #F5A623 0%, #FFD07A 100%)',
              boxShadow: '0 4px 12px rgba(245, 166, 35, 0.3)',
            }}
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium text-white/80 bg-white/10 border border-white/10 hover:bg-white/15 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
