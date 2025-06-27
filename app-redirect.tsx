import { useEffect } from 'react';
import { useLocation } from 'wouter';

export const AppRedirect = () => {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Use the router to navigate programmatically
    setLocation('/app/dashboard');
  }, [setLocation]);

  // Render a loading indicator while redirecting
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-900">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-t-2 border-b-2 border-teal-400 rounded-full animate-spin mb-4"></div>
        <p className="text-teal-300 text-lg font-medium">Redirecting to Dashboard...</p>
      </div>
    </div>
  );
};

export default AppRedirect;