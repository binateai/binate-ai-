// This utility helps with dynamically detecting the current hostname for OAuth redirects
// It's crucial for the Google OAuth flow to use the exact same redirect URI throughout

function getCurrentOrigin() {
  return window.location.origin;
}

function getCallbackUrl() {
  return `${getCurrentOrigin()}/api/auth/google/callback`;
}

function updateRedirectUriDisplay() {
  // Find elements with the data-redirect-uri attribute and update their content
  const elements = document.querySelectorAll('[data-redirect-uri]');
  elements.forEach(el => {
    el.textContent = getCallbackUrl();
  });
  
  // Also log it to the console for debugging
  console.log("Current origin:", getCurrentOrigin());
  console.log("Redirect URL should be:", getCallbackUrl());
}

// Call this when the page loads
document.addEventListener('DOMContentLoaded', updateRedirectUriDisplay);