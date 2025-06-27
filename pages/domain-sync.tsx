import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Database, Server, Globe, RefreshCcw } from 'lucide-react';
import { Link } from 'wouter';

type DomainSyncResponse = {
  timestamp: string;
  request: {
    host: string;
    protocol: string;
    fullUrl: string;
  };
  database: {
    connected: boolean;
    responseTimeMs: number;
    postgresVersion: string;
    serverTime: string;
    userCount: number;
    usersSample: Array<{
      id: number;
      username: string;
      email: string;
      created_at: string;
    }>;
  };
  isProductionDomain: boolean;
  environment: string;
};

export default function DomainSync() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncData, setSyncData] = useState<DomainSyncResponse | null>(null);
  const [domainName, setDomainName] = useState<string>('');

  useEffect(() => {
    // Get the current domain
    setDomainName(window.location.hostname);
    checkSync();
  }, []);

  const checkSync = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/domain-sync/check');
      if (!response.ok) {
        throw new Error(`Domain sync check failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setSyncData(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-4 text-center">Domain Synchronization Check</h1>
      <p className="text-center mb-8 text-muted-foreground">
        This tool helps verify if both Replit and binateai.com domains are using the same database
      </p>
      
      {loading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Domain Information
              </CardTitle>
              <CardDescription>
                Details about your current domain connection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="font-medium">Current Host:</span>
                  <Badge variant="outline">{syncData?.request.host || domainName}</Badge>
                </div>
                
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="font-medium">Environment:</span>
                  <Badge>{syncData?.environment || 'Unknown'}</Badge>
                </div>
                
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="font-medium">Domain Type:</span>
                  {syncData?.isProductionDomain ? (
                    <Badge variant="default" className="bg-green-500">Production</Badge>
                  ) : (
                    <Badge variant="secondary">Development</Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="font-medium">Full URL:</span>
                  <span className="text-xs break-all text-muted-foreground">{syncData?.request.fullUrl}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Database Connection
              </CardTitle>
              <CardDescription>
                Current PostgreSQL database connection status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="font-medium">Status:</span>
                  {syncData?.database.connected ? (
                    <Badge className="bg-green-500">Connected</Badge>
                  ) : (
                    <Badge variant="destructive">Disconnected</Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="font-medium">Response Time:</span>
                  <span>{syncData?.database.responseTimeMs}ms</span>
                </div>
                
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="font-medium">Server Time:</span>
                  <span>{syncData?.database.serverTime}</span>
                </div>
                
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="font-medium">Version:</span>
                  <span className="text-xs">{syncData?.database.postgresVersion.split(' ')[0]}</span>
                </div>
                
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="font-medium">User Count:</span>
                  <Badge variant="secondary">{syncData?.database.userCount}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Users in Database</CardTitle>
              <CardDescription>
                Sample of users from the connected database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left text-xs font-medium">ID</th>
                      <th className="p-2 text-left text-xs font-medium">Username</th>
                      <th className="p-2 text-left text-xs font-medium">Email</th>
                      <th className="p-2 text-left text-xs font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {syncData?.database.usersSample.map(user => (
                      <tr key={user.id} className="border-b border-muted">
                        <td className="p-2 text-xs">{user.id}</td>
                        <td className="p-2 text-xs">{user.username}</td>
                        <td className="p-2 text-xs">{user.email}</td>
                        <td className="p-2 text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>How to check for synchronization:</AlertTitle>
                <AlertDescription>
                  <p className="text-sm mb-2">
                    If you see the same user data when accessing this page from both:
                  </p>
                  <ul className="list-disc pl-5 text-xs space-y-1">
                    <li>The Replit domain (preview or editor URL)</li>
                    <li>The production domain (binateai.com)</li>
                  </ul>
                  <p className="text-sm mt-2">
                    Then both domains are using the same database. If not, they have separate databases.
                  </p>
                </AlertDescription>
              </Alert>
              
              <div className="w-full flex gap-4 justify-center">
                <Button onClick={checkSync} className="flex items-center gap-2">
                  <RefreshCcw className="h-4 w-4" />
                  Refresh
                </Button>
                <Button asChild variant="outline">
                  <Link href="/db-status">Database Status</Link>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}