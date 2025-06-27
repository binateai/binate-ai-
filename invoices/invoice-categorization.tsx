import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Invoice, InvoiceItem } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { 
  Tags, 
  FileText, 
  PlusCircle, 
  Edit, 
  SlidersHorizontal, 
  Loader2, 
  TagIcon,
  Flame,
  Scan,
  BadgeCheck,
  Zap
} from "lucide-react";

// Default categories
const DEFAULT_CATEGORIES = [
  { id: "service", label: "Services", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  { id: "product", label: "Products", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  { id: "expense", label: "Expenses", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  { id: "consulting", label: "Consulting", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  { id: "other", label: "Other", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400" },
];

interface InvoiceCategorizationProps {
  invoices: Invoice[];
}

export default function InvoiceCategorization({ invoices }: InvoiceCategorizationProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [newCategory, setNewCategory] = useState({ id: "", label: "", color: "" });
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingItemCategory, setEditingItemCategory] = useState<string>("");
  const [editingItemTags, setEditingItemTags] = useState<string>("");
  
  // Get all invoice items
  const allInvoiceItems = invoices.flatMap(invoice => {
    const items = Array.isArray(invoice.items) ? invoice.items as InvoiceItem[] : [];
    return items.map((item, index) => ({
      ...item,
      id: `${invoice.id}-${index}`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      client: invoice.client,
      date: invoice.issueDate,
    }));
  });
  
  // Add auto-categorization mutation
  const autoCategorizeInvoicesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/invoices/auto-categorize", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Invoices have been automatically categorized",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to categorize invoices",
        variant: "destructive",
      });
    }
  });
  
  // Update item category mutation
  const updateItemCategoryMutation = useMutation({
    mutationFn: async ({ invoiceId, itemId, category, tags }: any) => {
      return apiRequest("PATCH", `/api/invoices/${invoiceId}/items`, {
        itemId,
        category,
        tags: tags.split(",").map((tag: string) => tag.trim()).filter(Boolean),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Item category has been updated",
      });
      setEditingItemId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update item category",
        variant: "destructive",
      });
    }
  });
  
  // Add new category
  const handleAddCategory = () => {
    if (!newCategory.id || !newCategory.label) {
      toast({
        title: "Invalid category",
        description: "Category ID and label are required",
        variant: "destructive",
      });
      return;
    }
    
    setCategories([
      ...categories,
      {
        ...newCategory,
        color: newCategory.color || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
      },
    ]);
    
    setNewCategory({ id: "", label: "", color: "" });
    setCategoryDialogOpen(false);
    
    toast({
      title: "Category added",
      description: `Category "${newCategory.label}" has been added`,
    });
  };
  
  // Get category badge
  const getCategoryBadge = (categoryId: string | undefined) => {
    const category = categories.find(cat => cat.id === categoryId);
    
    if (!category) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <TagIcon className="h-3 w-3" />
          Uncategorized
        </Badge>
      );
    }
    
    return (
      <Badge className={`${category.color} flex items-center gap-1`}>
        <TagIcon className="h-3 w-3" />
        {category.label}
      </Badge>
    );
  };
  
  // Edit item category
  const handleEditItemCategory = (id: string, category: string = "", tags: string = "") => {
    setEditingItemId(id as unknown as number);
    setEditingItemCategory(category);
    setEditingItemTags(tags);
  };
  
  // Save item category
  const handleSaveItemCategory = () => {
    if (!editingItemId) return;
    
    const [invoiceId, itemIndex] = (editingItemId as unknown as string).split('-');
    
    updateItemCategoryMutation.mutate({
      invoiceId: parseInt(invoiceId),
      itemId: parseInt(itemIndex),
      category: editingItemCategory,
      tags: editingItemTags,
    });
  };
  
  // Auto-categorize
  const handleAutoCategorize = () => {
    autoCategorizeInvoicesMutation.mutate();
  };
  
  // Group items by category
  const itemsByCategory = allInvoiceItems.reduce<Record<string, any[]>>((acc, item) => {
    const category = item.category || "uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});
  
  // Calculate totals by category
  const categoryTotals = Object.entries(itemsByCategory).map(([category, items]) => ({
    category,
    count: items.length,
    total: items.reduce((sum, item) => sum + item.total, 0),
  }));
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
            <div>
              <CardTitle>Invoice Categorization</CardTitle>
              <CardDescription>
                Organize invoice items by category and tags
              </CardDescription>
            </div>
            
            <div className="flex space-x-2">
              <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                    <DialogDescription>
                      Create a new category for classifying invoice items.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="categoryId" className="text-right">
                        ID
                      </Label>
                      <Input
                        id="categoryId"
                        placeholder="service"
                        value={newCategory.id}
                        onChange={(e) => setNewCategory({ ...newCategory, id: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="categoryLabel" className="text-right">
                        Label
                      </Label>
                      <Input
                        id="categoryLabel"
                        placeholder="Services"
                        value={newCategory.label}
                        onChange={(e) => setNewCategory({ ...newCategory, label: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="categoryColor" className="text-right">
                        Color
                      </Label>
                      <Select
                        value={newCategory.color}
                        onValueChange={(value) => setNewCategory({ ...newCategory, color: value })}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select a color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            <div className="flex items-center">
                              <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                              Blue
                            </div>
                          </SelectItem>
                          <SelectItem value="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <div className="flex items-center">
                              <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                              Green
                            </div>
                          </SelectItem>
                          <SelectItem value="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                            <div className="flex items-center">
                              <div className="w-4 h-4 rounded-full bg-amber-500 mr-2"></div>
                              Amber
                            </div>
                          </SelectItem>
                          <SelectItem value="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            <div className="flex items-center">
                              <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                              Red
                            </div>
                          </SelectItem>
                          <SelectItem value="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                            <div className="flex items-center">
                              <div className="w-4 h-4 rounded-full bg-purple-500 mr-2"></div>
                              Purple
                            </div>
                          </SelectItem>
                          <SelectItem value="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                            <div className="flex items-center">
                              <div className="w-4 h-4 rounded-full bg-gray-500 mr-2"></div>
                              Gray
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddCategory}>Add Category</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="default" 
                size="sm"
                onClick={handleAutoCategorize}
                disabled={autoCategorizeInvoicesMutation.isPending}
              >
                {autoCategorizeInvoicesMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Auto-Categorize
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {allInvoiceItems.length === 0 ? (
            <div className="text-center p-6">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-2 font-medium">No invoice items</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add some invoices with line items to start categorizing.
              </p>
            </div>
          ) : (
            <div>
              {/* Category Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Category Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {categoryTotals.map(({ category, count, total }) => {
                    const categoryObj = categories.find(c => c.id === category) || {
                      id: "uncategorized",
                      label: "Uncategorized",
                      color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                    };
                    
                    return (
                      <div 
                        key={category} 
                        className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <Badge className={`${categoryObj.color} mb-2`}>
                            {categoryObj.label}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{count} items</span>
                        </div>
                        <div className="text-2xl font-bold mt-1">{formatCurrency(total)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Category table */}
              <div>
                <h3 className="text-lg font-medium mb-3">Invoice Items</h3>
                
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allInvoiceItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.description}</TableCell>
                          <TableCell>{item.invoiceNumber}</TableCell>
                          <TableCell>{item.client}</TableCell>
                          <TableCell>{formatCurrency(item.total)}</TableCell>
                          <TableCell>
                            {getCategoryBadge(item.category)}
                            {item.tags && Array.isArray(item.tags) && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.tags.map((tag: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs py-0">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editingItemId === item.id ? (
                              <div className="flex items-center justify-end space-x-2">
                                <Select
                                  value={editingItemCategory}
                                  onValueChange={setEditingItemCategory}
                                >
                                  <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories.map((category) => (
                                      <SelectItem key={category.id} value={category.id}>
                                        {category.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Input
                                  placeholder="Tags (comma separated)"
                                  value={editingItemTags}
                                  onChange={(e) => setEditingItemTags(e.target.value)}
                                  className="w-[150px]"
                                />
                                <Button
                                  size="sm"
                                  onClick={handleSaveItemCategory}
                                  disabled={updateItemCategoryMutation.isPending}
                                >
                                  {updateItemCategoryMutation.isPending ? "Saving..." : "Save"}
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditItemCategory(
                                  item.id as string,
                                  item.category,
                                  item.tags ? Array.isArray(item.tags) ? item.tags.join(", ") : "" : ""
                                )}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t flex justify-between py-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Flame className="h-4 w-4 mr-1" />
            <span>Smart categorization uses AI to identify patterns in your invoices</span>
          </div>
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Manage Categories
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}