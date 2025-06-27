import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import DevNav from "../dev-nav";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar component with fixed width */}
      <div className="hidden md:block fixed top-0 left-0 h-full z-10 w-60 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
        <Sidebar />
      </div>
      
      {/* Main content with proper margin for sidebar */}
      <div className="flex flex-col flex-1 ml-0 md:ml-60 w-full">
        {/* Development Navigation Banner */}
        <DevNav />
        
        <main className="flex-1 relative focus:outline-none">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}