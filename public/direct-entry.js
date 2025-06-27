// Direct entry script for Binate AI in stealth mode
// This script enables secure transitions between the landing page and app

(function() {
  // Handle direct navigation between landing page and application
  function setupDirectNavigation() {
    // 1. Fix login button
    const loginButton = document.querySelector('a[href="/auth"]');
    if (loginButton) {
      loginButton.addEventListener('click', function(e) {
        e.preventDefault();
        sessionStorage.setItem('coming_from_landing', 'true');
        window.location.href = '/auth';
      });
    }
    
    // 2. Fix dashboard button
    const dashboardButton = document.querySelector('a[href="/app/dashboard"]');
    if (dashboardButton) {
      dashboardButton.addEventListener('click', function(e) {
        e.preventDefault();
        sessionStorage.setItem('coming_from_landing', 'true');
        window.location.href = '/app/dashboard';
      });
    }
    
    // 3. Fix waitlist form
    const waitlistForm = document.getElementById('waitlistForm');
    if (waitlistForm) {
      waitlistForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const company = document.getElementById('company').value;
        const role = document.getElementById('role').value;
        
        // Store in local storage temporarily
        const waitlistEntry = {
          fullName,
          email,
          company,
          role,
          date: new Date().toISOString()
        };
        
        let waitlist = [];
        try {
          const existingWaitlist = localStorage.getItem('binate_waitlist');
          if (existingWaitlist) {
            waitlist = JSON.parse(existingWaitlist);
          }
        } catch (e) {
          console.error('Error parsing waitlist data:', e);
        }
        
        waitlist.push(waitlistEntry);
        localStorage.setItem('binate_waitlist', JSON.stringify(waitlist));
        
        // Show confirmation
        alert('Thank you for joining our waitlist! We will notify you when access becomes available.');
        
        // Reset form
        waitlistForm.reset();
      });
    }
  }
  
  // Register event handler when the DOM is fully loaded
  document.addEventListener('DOMContentLoaded', setupDirectNavigation);
})();