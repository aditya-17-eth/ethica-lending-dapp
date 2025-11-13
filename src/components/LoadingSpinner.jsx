const LoadingSpinner = ({ 
  size = 'md', 
  color = 'blue', 
  text = '', 
  overlay = false,
  className = '' 
}) => {
  // Size configurations
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  // Color configurations
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    red: 'text-red-600',
    gray: 'text-gray-600',
    white: 'text-white'
  };

  const spinnerElement = (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        <svg
          className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        {text && (
          <p className={`text-sm ${colorClasses[color]} animate-pulse`}>
            {text}
          </p>
        )}
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          {spinnerElement}
        </div>
      </div>
    );
  }

  return spinnerElement;
};

// Skeleton loading component for content placeholders
export const SkeletonLoader = ({ 
  lines = 3, 
  className = '',
  animate = true 
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-gray-200 rounded ${animate ? 'animate-pulse' : ''}`}
          style={{
            width: `${Math.random() * 40 + 60}%`
          }}
        ></div>
      ))}
    </div>
  );
};

// Card skeleton for dashboard cards
export const CardSkeleton = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="animate-pulse">
        <div className="flex items-center space-x-4 mb-4">
          <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    </div>
  );
};

// Button loading state
export const LoadingButton = ({ 
  isLoading, 
  children, 
  loadingText = 'Loading...', 
  className = '',
  ...props 
}) => {
  return (
    <button
      className={`flex items-center justify-center space-x-2 ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading && (
        <LoadingSpinner size="sm" color="white" />
      )}
      <span>{isLoading ? loadingText : children}</span>
    </button>
  );
};

export default LoadingSpinner;