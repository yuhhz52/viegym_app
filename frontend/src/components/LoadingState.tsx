interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingState = ({ 
  message = 'Đang tải...', 
  fullScreen = false,
  size = 'md' 
}: LoadingStateProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const containerClasses = fullScreen
    ? 'flex items-center justify-center h-screen fixed top-0 left-0 right-0 bottom-0 w-full z-50 bg-white dark:bg-gray-900'
    : 'flex items-center justify-center py-12';

  return (
    <div className={containerClasses}>
      <div className="text-center space-y-3">
        <div className={`${sizeClasses[size]} border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto`}></div>
        {message && (
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{message}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingState;
