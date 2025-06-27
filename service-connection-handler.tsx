import { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function ServiceConnectionHandler() {
  const [location] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Parse query parameters
    const searchParams = new URLSearchParams(window.location.search);
    
    // Handle Google connection success
    if (searchParams.has('success')) {
      const successType = searchParams.get('success');
      
      if (successType === 'google_connected') {
        // Fetch connected services to update UI state
        queryClient.invalidateQueries({ queryKey: ['/api/connected-services'] });
        
        toast({
          title: "Google account connected",
          description: "Your Google account has been successfully connected. You can now use Gmail and Calendar integration.",
          duration: 5000,
        });
        
        // Clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      if (successType === 'stripe_connected') {
        // Fetch connected services to update UI state
        queryClient.invalidateQueries({ queryKey: ['/api/connected-services'] });
        
        toast({
          title: "Stripe account connected",
          description: "Your Stripe account has been successfully connected. You can now use payment processing and invoicing features.",
          duration: 5000,
        });
        
        // Clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
    
    // Handle connection errors
    if (searchParams.has('error')) {
      const errorMessage = searchParams.get('error');
      const serviceType = searchParams.get('service') || 'service';
      
      toast({
        title: `${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} connection error`,
        description: errorMessage || "There was an error connecting your account.",
        variant: "destructive",
        duration: 5000,
      });
      
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location, toast, queryClient]);
  
  return null; // This component doesn't render anything
}