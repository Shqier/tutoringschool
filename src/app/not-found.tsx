import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0D10] min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <div className="mb-6">
            <span className="text-8xl font-bold bg-gradient-to-r from-[#F5A623] to-[#FFD07A] bg-clip-text text-transparent">
              404
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">Page Not Found</h1>
          <p className="text-white/60 mb-8 max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium text-[#0B0D10] transition-opacity hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, #F5A623 0%, #FFD07A 100%)',
              boxShadow: '0 4px 12px rgba(245, 166, 35, 0.3)',
            }}
          >
            Back to Dashboard
          </Link>
        </div>
      </body>
    </html>
  );
}
