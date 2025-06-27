import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Invoice } from "@shared/schema";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/utils";
import { Plus } from "lucide-react";

type InvoiceCardProps = {
  invoices: Invoice[];
};

export default function InvoiceCard({ invoices }: InvoiceCardProps) {
  const recentInvoices = invoices.slice(0, 3);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: "text-green-500",
      pending: "text-amber-500",
      overdue: "text-red-500",
      draft: "text-muted-foreground",
    };
    
    return colors[status] || colors.draft;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-border flex justify-between items-center">
        <CardTitle>Recent Invoices</CardTitle>
        <Link href="/invoices">
          <Button variant="link" className="text-sm p-0 h-auto">View all</Button>
        </Link>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {recentInvoices.length > 0 ? (
            recentInvoices.map((invoice) => (
              <div key={invoice.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{invoice.client}</p>
                  <p className="text-xs text-muted-foreground">{invoice.number}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCurrency(invoice.amount)}</p>
                  <p className={`text-xs ${getStatusColor(invoice.status)}`}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">No invoices yet</p>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-border">
          <Link href="/invoices">
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Create New Invoice
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
