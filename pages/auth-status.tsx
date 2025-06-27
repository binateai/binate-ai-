import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle, RefreshCw, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const AuthStatusPage = () => {
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAuthStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest('GET', '/api/auth/status');
      const data = await response.json();
      setAuthStatus(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching authentication status');
      toast({
        title: "Error",
        description: "Failed to fetch authentication status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthStatus();
  }, []);

  const handleTestLogin = async () => {
    try {
      setLoading(true);
      
      // Test credentials - these should match the test user in the database
      // We've just reset the password to ensure the hash is correct
      const response = await apiRequest('POST', '/api/login', {
        username: 'shaima123',
        password: 'Tiaali59'
      });
      
      if (response.ok) {
        toast({
          title: "Login Successful",
          description: "Successfully logged in with test account",
        });
        fetchAuthStatus();
      } else {
        const text = await response.text();
        toast({
          title: "Login Failed",
          description: text || "Error logging in with test account",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Login Error",
        description: err.message || "Error logging in with test account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('POST', '/api/logout');
      
      if (response.ok) {
        toast({
          title: "Logout Successful",
          description: "Successfully logged out",
        });
        fetchAuthStatus();
      } else {
        const text = await response.text();
        toast({
          title: "Logout Failed",
          description: text || "Error logging out",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Logout Error",
        description: err.message || "Error logging out",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-6xl py-10">
      <h1 className="text-3xl font-bold mb-6">Authentication Diagnostic</h1>
      <p className="text-muted-foreground mb-6">
        This page helps diagnose authentication issues by showing the current session state and authentication status.
      </p>

      <div className="mb-4 flex gap-2">
        <Button onClick={fetchAuthStatus} disabled={loading} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
        <Button onClick={handleTestLogin} disabled={loading} variant="outline">
          Test Login
        </Button>
        <Button onClick={handleLogout} disabled={loading} variant="outline">
          Test Logout
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardHeader className="text-destructive">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {authStatus?.authenticated ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Authenticated
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  Not Authenticated
                </>
              )}
            </CardTitle>
            <CardDescription>
              Authentication status based on current session
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : authStatus?.user ? (
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">User ID:</span> {authStatus.user.id}
                </div>
                <div>
                  <span className="font-semibold">Username:</span> {authStatus.user.username}
                </div>
              </div>
            ) : (
              <p>No active user session</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
            <CardDescription>
              Details about the current session cookie
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-auto">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : authStatus?.session ? (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Session ID:</span> {authStatus.session.id}
                </div>
                <div>
                  <span className="font-semibold">Max Age:</span> {Math.floor(authStatus.session.cookie.maxAge / (1000 * 60 * 60))} hours
                </div>
                <div>
                  <span className="font-semibold">Secure:</span> {authStatus.session.cookie.secure ? 'Yes' : 'No'}
                </div>
                <div>
                  <span className="font-semibold">HTTP Only:</span> {authStatus.session.cookie.httpOnly ? 'Yes' : 'No'}
                </div>
                <div>
                  <span className="font-semibold">Domain:</span> {authStatus.session.cookie.domain || 'Not set'}
                </div>
                <div>
                  <span className="font-semibold">Path:</span> {authStatus.session.cookie.path || '/'}
                </div>
                <div>
                  <span className="font-semibold">SameSite:</span> {authStatus.session.cookie.sameSite || 'Default'}
                </div>
              </div>
            ) : (
              <p>No session information available</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Request Headers</CardTitle>
            <CardDescription>
              HTTP headers from your current request
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : authStatus?.headers ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {Object.entries(authStatus.headers).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-semibold">{key}:</span> {value as string}
                  </div>
                ))}
              </div>
            ) : (
              <p>No header information available</p>
            )}
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            For security reasons, some headers may be omitted
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AuthStatusPage;