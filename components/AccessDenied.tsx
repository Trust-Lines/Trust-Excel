import React from 'react';

interface AccessDeniedProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  title = 'Access Denied',
  message = 'You do not have permission to access this page. Please contact your administrator if you believe this is an error.',
  icon,
}) => {
  const defaultIcon = (
    <svg
      className="w-16 h-16 text-red-500 mx-auto mb-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-6V9m0 0V7m0 2h2m-2 0H10m7-1a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {icon || defaultIcon}

        <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>

        <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>

        <div className="space-y-3">
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>

          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Need access? Contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;