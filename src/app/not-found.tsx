import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto h-24 w-24 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <svg
              className="h-12 w-12 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          404 - Page Not Found
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Sorry, the page you are looking for doesn&apos;t exist or has been moved.
        </p>
        
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Go to Dashboard
          </Link>
          
          <Link
            href="/login"
            className="inline-block w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Back to Login
          </Link>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Need help? Contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}