import { Link, useLocation } from "wouter";
import {
  BarChart3,
  Calendar,
  Inbox,
  Settings,
  UserRound,
  ListTodo,
  FileText,
  BrainCircuit,
  LogOut,
  ReceiptText,
  ShieldCheck,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

// Navigation items with icons, labels, and paths
const navigationItems = [
  { 
    icon: BarChart3, 
    label: "Dashboard", 
    path: "/app/dashboard" 
  },
  { 
    icon: Inbox, 
    label: "Emails", 
    path: "/app/emails" 
  },
  { 
    icon: Calendar, 
    label: "Calendar", 
    path: "/app/calendar" 
  },
  { 
    icon: ListTodo, 
    label: "Tasks", 
    path: "/app/tasks" 
  },
  { 
    icon: UserRound, 
    label: "Leads", 
    path: "/app/leads" 
  },
  { 
    icon: FileText, 
    label: "Invoices", 
    path: "/app/invoices" 
  },
  { 
    icon: ReceiptText, 
    label: "Expenses", 
    path: "/app/expenses" 
  },
  { 
    icon: BrainCircuit, 
    label: "AI Assistant", 
    path: "/app/ai-assistant" 
  },
  { 
    icon: Settings, 
    label: "Settings", 
    path: "/app/settings",
    subItems: [
      {
        label: "Email Integration",
        path: "/app/settings/email"
      }
    ]
  },
  { 
    icon: ShieldCheck, 
    label: "Admin", 
    path: "/app/admin/beta-signups",
    highlight: true
  },
];

import { useState, useEffect } from "react";

export function Sidebar() {
  const [location] = useLocation();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
  // Auto-expand settings when on a settings subpage
  useEffect(() => {
    if (location.startsWith("/app/settings/")) {
      setExpandedItems(prev => ({
        ...prev,
        "/app/settings": true
      }));
    }
  }, [location]);
  
  const toggleExpanded = (path: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };
  
  return (
    <div className="flex w-60 flex-col fixed inset-y-0 z-30">
      <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-gray-950 border-r">
        <div className="flex items-center h-16 flex-shrink-0 px-4 border-b">
          <h1 className="text-lg font-semibold">Binate AI</h1>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
          <nav className="flex-1 px-2 space-y-1">
            {navigationItems.map((item) => {
              const isActive = location === item.path;
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedItems[item.path];
              const isSubItemActive = hasSubItems && item.subItems?.some(subItem => location === subItem.path);
              
              return (
                <div key={item.path} className="space-y-1">
                  <div
                    className={cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                      isActive || isSubItemActive
                        ? "bg-primary/10 text-primary"
                        : item.highlight 
                          ? "text-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-900/20 ring-1 ring-teal-300 dark:ring-teal-800"
                          : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    )}
                    onClick={() => hasSubItems ? toggleExpanded(item.path) : null}
                  >
                    <Link
                      to={item.path}
                      className="flex-1 flex items-center"
                      onClick={(e) => hasSubItems && e.preventDefault()}
                    >
                      <item.icon
                        className={cn(
                          "mr-3 flex-shrink-0 h-5 w-5",
                          isActive || isSubItemActive
                            ? "text-primary"
                            : item.highlight
                              ? "text-teal-500 dark:text-teal-400"
                              : "text-gray-500 dark:text-gray-400"
                        )}
                      />
                      {item.label}
                    </Link>
                    
                    {item.highlight && (
                      <span className="ml-auto bg-teal-100 text-teal-800 text-xs font-medium px-2 py-0.5 rounded dark:bg-teal-900 dark:text-teal-300">
                        New
                      </span>
                    )}
                    
                    {hasSubItems && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={cn(
                          "h-5 w-5 transition-transform", 
                          isExpanded ? "transform rotate-180" : ""
                        )} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                  
                  {/* Sub-items */}
                  {hasSubItems && isExpanded && (
                    <div className="pl-10 space-y-1">
                      {item.subItems?.map(subItem => {
                        const isSubActive = location === subItem.path;
                        return (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            className={cn(
                              "flex items-center py-2 text-sm rounded-md transition-colors",
                              isSubActive
                                ? "text-primary font-medium"
                                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            )}
                          >
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
          
          {/* Add logout button at the bottom */}
          <div className="mt-auto pt-4 border-t border-gray-200">
            <button 
              onClick={async () => {
                try {
                  await fetch('/api/logout', {
                    method: 'POST',
                    credentials: 'include'
                  });
                  window.location.href = '/auth';
                } catch (error) {
                  console.error('Logout failed:', error);
                }
              }}
              className="flex items-center px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md w-full"
            >
              <LogOut className="mr-3 flex-shrink-0 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}