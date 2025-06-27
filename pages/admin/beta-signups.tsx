import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { Loader2, RefreshCw, AlertCircle, Search, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

type BetaSignup = {
  id: number;
  email: string;
  status: "pending" | "contacted" | "active";
  joinedAt: string;
  ipAddress: string | null;
  referrer: string | null;
  notifiedAt: string | null;
};

export default function BetaSignupsPage() {
  // Use the fetch method in a useEffect hook and manage our own state instead of useCurrentUser
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch the current user
  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }
    
    fetchUser();
  }, []);
  
  const { data: signups, isLoading, error, refetch } = useQuery<BetaSignup[]>({
    queryKey: ["/api/beta-signups"],
    retry: false,
    refetchOnWindowFocus: true, // Auto-refresh when window gains focus
    refetchInterval: 10000, // Auto-refresh every 10 seconds
    enabled: !!user && user.id === 1, // Only fetch if user is admin
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500 hover:bg-green-600";
      case "contacted":
        return "bg-blue-500 hover:bg-blue-600";
      case "pending":
      default:
        return "bg-amber-500 hover:bg-amber-600";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const filteredSignups = signups?.filter(signup => 
    signup.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    if (!signups || signups.length === 0) return;

    const headers = ["ID", "Email", "Status", "Joined At", "IP Address", "Referrer"];
    const csvContent = [
      headers.join(","),
      ...signups.map(signup => [
        signup.id,
        signup.email,
        signup.status,
        new Date(signup.joinedAt).toISOString(),
        signup.ipAddress || "",
        (signup.referrer || "").replace(/,/g, " ") // Remove commas from referrer
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `beta-signups-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: `Exported ${signups.length} beta signups to CSV`,
    });
  };

  // Return loading state if auth is still loading
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if not authenticated or not admin (user id 1)
  if (!user || user.id !== 1) {
    return <Redirect to="/auth" />;
  }

  return (
    <div className="container py-10 space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Beta Signup Management</h1>
          <p className="text-muted-foreground">
            View and manage all beta signups for Binate AI
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => refetch()} 
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>

          <Button 
            onClick={exportToCSV} 
            className="flex items-center gap-2"
            disabled={!signups || signups.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>All Beta Signups</CardTitle>
              <CardDescription>
                {signups ? `${signups.length} total signups` : 'Loading...'}
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by email..."
                className="w-full sm:w-[280px] pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex justify-center py-10 text-center">
              <div className="flex flex-col items-center gap-2">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-muted-foreground">Failed to load beta signups</p>
                <Button variant="outline" onClick={() => refetch()}>
                  Try Again
                </Button>
              </div>
            </div>
          ) : !signups || signups.length === 0 ? (
            <div className="flex justify-center py-10 text-center">
              <p className="text-muted-foreground">No beta signups found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="hidden md:table-cell">IP Address</TableHead>
                  <TableHead className="hidden md:table-cell">Referrer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSignups?.map((signup) => (
                  <TableRow key={signup.id}>
                    <TableCell>{signup.id}</TableCell>
                    <TableCell className="font-medium">{signup.email}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(signup.status)}>
                        {signup.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(signup.joinedAt)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {signup.ipAddress || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px] truncate" title={signup.referrer || undefined}>
                      {signup.referrer || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>
                {filteredSignups && signups && 
                  `Showing ${filteredSignups.length} of ${signups.length} signups`
                }
              </TableCaption>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}