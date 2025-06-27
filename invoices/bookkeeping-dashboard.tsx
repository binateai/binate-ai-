import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { format, addMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Invoice } from "@shared/schema";
import { DollarSign, CalendarDays, Clock, AlertTriangle, CheckCircle, Circle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Helper function to get the number of days an invoice is overdue
const getDaysOverdue = (invoice: Invoice) => {
  if (!invoice.dueDate || invoice.status !== 'overdue') return 0;
  
  const dueDate = new Date(invoice.dueDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - dueDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Helper function to filter invoices by month
const filterInvoicesByMonth = (invoices: Invoice[], month: Date) => {
  const startDate = startOfMonth(month);
  const endDate = endOfMonth(month);
  
  return invoices.filter(invoice => {
    const issueDate = invoice.issueDate ? new Date(invoice.issueDate) : null;
    return issueDate && isWithinInterval(issueDate, { start: startDate, end: endDate });
  });
};

// Helper function to group invoices by client
const groupInvoicesByClient = (invoices: Invoice[]) => {
  const groups: Record<string, Invoice[]> = {};
  
  invoices.forEach(invoice => {
    if (!groups[invoice.client]) {
      groups[invoice.client] = [];
    }
    groups[invoice.client].push(invoice);
  });
  
  return Object.entries(groups).map(([client, invoices]) => ({
    client,
    count: invoices.length,
    total: invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
    paid: invoices.filter(inv => inv.status === 'paid').reduce((sum, invoice) => sum + invoice.amount, 0),
    pending: invoices.filter(inv => inv.status === 'pending').reduce((sum, invoice) => sum + invoice.amount, 0),
    overdue: invoices.filter(inv => inv.status === 'overdue').reduce((sum, invoice) => sum + invoice.amount, 0),
  }));
};

// Helper function to group invoices by category
const groupInvoicesByCategory = (invoices: Invoice[]) => {
  const groups: Record<string, number> = {};
  
  invoices.forEach(invoice => {
    const category = invoice.category || 'Uncategorized';
    if (!groups[category]) {
      groups[category] = 0;
    }
    groups[category] += invoice.amount;
  });
  
  return Object.entries(groups).map(([name, value]) => ({ name, value }));
};

// Helper function to summarize invoices by status
const summarizeInvoicesByStatus = (invoices: Invoice[]) => {
  const paid = invoices.filter(invoice => invoice.status === 'paid');
  const pending = invoices.filter(invoice => invoice.status === 'pending');
  const overdue = invoices.filter(invoice => invoice.status === 'overdue');
  const draft = invoices.filter(invoice => invoice.status === 'draft');
  
  return {
    paid: {
      count: paid.length,
      total: paid.reduce((sum, invoice) => sum + invoice.amount, 0),
    },
    pending: {
      count: pending.length,
      total: pending.reduce((sum, invoice) => sum + invoice.amount, 0),
    },
    overdue: {
      count: overdue.length,
      total: overdue.reduce((sum, invoice) => sum + invoice.amount, 0),
    },
    draft: {
      count: draft.length,
      total: draft.reduce((sum, invoice) => sum + invoice.amount, 0),
    },
    total: {
      count: invoices.length,
      total: invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
    }
  };
};

// Colors for our charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface BookkeepingDashboardProps {
  invoices: Invoice[];
}

export default function BookkeepingDashboard({ invoices }: BookkeepingDashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedTab, setSelectedTab] = useState<string>("status");
  
  // Filter invoices by selected month
  const filteredInvoices = filterInvoicesByMonth(invoices, selectedMonth);
  
  // Get summaries for different groupings
  const statusSummary = summarizeInvoicesByStatus(filteredInvoices);
  const clientGroups = groupInvoicesByClient(filteredInvoices);
  const categoryGroups = groupInvoicesByCategory(filteredInvoices);
  
  // Data for the status pie chart
  const statusPieData = [
    { name: 'Paid', value: statusSummary.paid.total },
    { name: 'Pending', value: statusSummary.pending.total },
    { name: 'Overdue', value: statusSummary.overdue.total },
    { name: 'Draft', value: statusSummary.draft.total },
  ].filter(item => item.value > 0);

  // Previous month button
  const handlePreviousMonth = () => {
    setSelectedMonth(prev => addMonths(prev, -1));
  };
  
  // Next month button
  const handleNextMonth = () => {
    setSelectedMonth(prev => addMonths(prev, 1));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Bookkeeping Dashboard</h2>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={handlePreviousMonth}
            className="p-2 rounded-md hover:bg-muted"
          >
            ←
          </button>
          <span className="font-medium">
            {format(selectedMonth, 'MMMM yyyy')}
          </span>
          <button 
            onClick={handleNextMonth}
            className="p-2 rounded-md hover:bg-muted"
          >
            →
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="bg-primary/20 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <h3 className="text-2xl font-bold">{formatCurrency(statusSummary.total.total)}</h3>
                <p className="text-sm text-muted-foreground">{statusSummary.total.count} invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <h3 className="text-2xl font-bold">{formatCurrency(statusSummary.paid.total)}</h3>
                <p className="text-sm text-muted-foreground">{statusSummary.paid.count} invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <h3 className="text-2xl font-bold">{formatCurrency(statusSummary.pending.total)}</h3>
                <p className="text-sm text-muted-foreground">{statusSummary.pending.count} invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <h3 className="text-2xl font-bold">{formatCurrency(statusSummary.overdue.total)}</h3>
                <p className="text-sm text-muted-foreground">{statusSummary.overdue.count} invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for different views */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-[400px]">
          <TabsTrigger value="status">By Status</TabsTrigger>
          <TabsTrigger value="client">By Client</TabsTrigger>
          <TabsTrigger value="category">By Category</TabsTrigger>
        </TabsList>
        
        {/* Status Tab */}
        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Distribution by Status</CardTitle>
              <CardDescription>
                Overview of your invoices by payment status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {statusPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`${formatCurrency(value)}`, 'Amount']}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No invoice data for this month</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {statusSummary.overdue.count > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Overdue Invoices</CardTitle>
                <CardDescription>
                  Invoices that need immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredInvoices
                    .filter(invoice => invoice.status === 'overdue')
                    .sort((a, b) => getDaysOverdue(b) - getDaysOverdue(a))
                    .map(invoice => (
                      <div key={invoice.id} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <p className="font-medium">{invoice.client}</p>
                          <p className="text-sm text-muted-foreground">Invoice #{invoice.number}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(invoice.amount)}</p>
                          <p className="text-sm text-red-500">
                            {getDaysOverdue(invoice)} days overdue
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Client Tab */}
        <TabsContent value="client" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Client</CardTitle>
              <CardDescription>
                Breakdown of your income from each client
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {clientGroups.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={clientGroups}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="client" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), 'Amount']} />
                      <Legend />
                      <Bar name="Paid" dataKey="paid" stackId="a" fill="#4ade80" />
                      <Bar name="Pending" dataKey="pending" stackId="a" fill="#fbbf24" />
                      <Bar name="Overdue" dataKey="overdue" stackId="a" fill="#f87171" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No client data for this month</p>
                  </div>
                )}
              </div>
              
              {/* Top Clients */}
              {clientGroups.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Top Clients</h4>
                  <div className="space-y-2">
                    {clientGroups
                      .sort((a, b) => b.total - a.total)
                      .slice(0, 5)
                      .map(group => (
                        <div key={group.client} className="flex justify-between">
                          <span>{group.client}</span>
                          <span className="font-medium">{formatCurrency(group.total)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Category Tab */}
        <TabsContent value="category" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Category</CardTitle>
              <CardDescription>
                Distribution of income across different service categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {categoryGroups.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryGroups}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryGroups.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`${formatCurrency(value)}`, 'Amount']}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No category data for this month</p>
                  </div>
                )}
              </div>
              
              {/* Category Breakdown */}
              {categoryGroups.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Category Breakdown</h4>
                  <div className="space-y-2">
                    {categoryGroups
                      .sort((a, b) => b.value - a.value)
                      .map(category => (
                        <div key={category.name} className="flex justify-between">
                          <span>{category.name}</span>
                          <span className="font-medium">{formatCurrency(category.value)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}