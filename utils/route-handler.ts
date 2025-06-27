/**
 * Route Handler Utility
 * 
 * Helps fix client-side routing issues on production deployments
 * ensuring proper navigation on binateai.com
 */

/**
 * Initializes route handling for production environment
 * Should be called early in app initialization
 */
export function initializeRouteHandling(): void {
  // Check if we have a redirect parameter, which comes from our 404.html solution
  const params = new URLSearchParams(window.location.search);
  const redirectPath = params.get('redirect');
  
  if (redirectPath) {
    // Remove the redirect param from the URL to keep it clean
    // and navigate to the intended path
    const cleanUrl = window.location.pathname + 
                    window.location.search.replace(`redirect=${encodeURIComponent(redirectPath)}`, '').replace(/^\?&/, '?').replace(/^\?$/, '') + 
                    window.location.hash;
    
    // Use history API to replace current state without reloading
    window.history.replaceState(null, '', cleanUrl);
    
    // Navigate to the intended path (without reloading the page)
    setTimeout(() => {
      window.history.replaceState(null, '', redirectPath);
    }, 10);
  }
}

/**
 * Ensures external links are properly handled
 * @param url The URL to navigate to
 * @param openInNewTab Whether to open in a new tab
 */
export function navigateTo(url: string, openInNewTab = false): void {
  // For external URLs, use window.open or location.href
  if (url.startsWith('http') || url.startsWith('//')) {
    if (openInNewTab) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = url;
    }
    return;
  }
  
  // For internal URLs, use history API
  window.history.pushState(null, '', url);
  
  // Dispatch a popstate event to trigger route updates
  window.dispatchEvent(new PopStateEvent('popstate'));
}