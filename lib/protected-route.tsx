import { ComponentType, useState, useEffect } from "react";
import { Route, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  component: ComponentType;
  path: string;
}

export function ProtectedRoute({ component: Component, path }: ProtectedRouteProps) {
  const ProtectedComponent = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [, navigate] = useLocation();
    const { toast } = useToast();

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const response = await fetch('/api/user', {
            credentials: 'include'
          });
          
          if (response.ok) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
            toast({
              title: "Authentication required",
              description: "Please log in to access this page",
              variant: "destructive"
            });
            // Store current location before redirecting
            sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
            navigate("/auth");
          }
        } catch (error) {
          console.error("Auth check error:", error);
          setIsAuthenticated(false);
          // Store current location before redirecting
          sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
          navigate("/auth");
        }
      };
      
      checkAuth();
    }, [navigate, toast]);
    
    if (isAuthenticated === null) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Verifying your session...</p>
          </div>
        </div>
      );
    }
    
    return isAuthenticated ? <Component /> : null;
  };
  
  return <Route path={path} component={ProtectedComponent} />;
}