/**
 * Domain Redirect Helper
 * 
 * This script helps redirect users from temporary Replit domains to 
 * the main fixed domain for OAuth operations.
 * 
 * How to use:
 * 1. Include this script in any page that uses OAuth
 * 2. It will automatically show a banner if the user is on a temporary domain
 * 3. The banner has a button to redirect to the main domain
 */

document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on a temporary domain
  const currentHost = window.location.hostname;
  
  // For Replit preview we don't need to redirect, so making this conditional
  if (currentHost.includes('replit.dev')) {
    // We're in the Replit preview environment - no need to show banner
    console.log('Running in Replit preview environment');
    return;
  }
  
  const mainDomain = 'binateai.com';
  
  // Only show the banner if we're on a temporary domain that's not in Replit preview
  if (currentHost !== mainDomain && currentHost.includes('replit')) {
    // Create the banner
    const banner = document.createElement('div');
    banner.style.position = 'fixed';
    banner.style.top = '0';
    banner.style.left = '0';
    banner.style.width = '100%';
    banner.style.backgroundColor = '#f8d7da';
    banner.style.color = '#721c24';
    banner.style.padding = '10px';
    banner.style.textAlign = 'center';
    banner.style.zIndex = '9999';
    banner.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    
    // Add content
    banner.innerHTML = `
      <strong>Warning:</strong> You are on a temporary domain (${currentHost}). Google OAuth will only work on the main domain.
      <button id="goto-main-domain" style="margin-left: 10px; background-color: #721c24; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer;">
        Go to Main Domain
      </button>
    `;
    
    // Add to the page
    document.body.prepend(banner);
    
    // Add event listener
    document.getElementById('goto-main-domain').addEventListener('click', function() {
      window.location.href = `https://${mainDomain}${window.location.pathname}${window.location.search}`;
    });
  }
});