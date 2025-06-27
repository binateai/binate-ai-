/**
 * Helper functions for protected route handling
 * Ensures proper navigation even with static landing page
 */

export const handleAuthRedirect = () => {
  // Check if there's an intended path in sessionStorage (set by static landing page)
  const intendedPath = sessionStorage.getItem('intendedPath');
  
  if (intendedPath) {
    // Clear it to prevent future redirects
    sessionStorage.removeItem('intendedPath');
    
    // If it's a dashboard path, navigate there
    if (intendedPath.startsWith('/app/')) {
      window.location.href = intendedPath;
      return true;
    }
  }
  
  return false;
};

// Function to help with login redirection
export const handleLoginRedirect = () => {
  // Clear any intended path
  sessionStorage.removeItem('intendedPath');
  
  // Set a new intended path for after login
  sessionStorage.setItem('intendedPath', '/app/dashboard');
  
  // Navigate to auth page
  window.location.href = '/auth';
  return true;
};