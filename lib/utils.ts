import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
}

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '-';
  }
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '$0.00';
  
  try {
    // Convert to number if it's a string
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Check if value is a valid number
    if (isNaN(numericAmount)) {
      console.error('Invalid currency amount:', amount);
      return '$0.00';
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numericAmount / 100);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return '$0.00';
  }
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function generateInvoiceNumber(): string {
  const prefix = 'INV';
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${year}-${random}`;
}

/**
 * Ensures a date is properly formatted for API calls
 * @param date A date string, Date object, or null
 * @returns An ISO format string or undefined if date is invalid
 */
export function formatDateForAPI(date: string | Date | null | undefined): string | undefined {
  if (!date) return undefined;
  
  try {
    // For string dates, parse them first
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Validate it's a real date
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date:', date);
      return undefined;
    }
    
    // Return ISO string
    return dateObj.toISOString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return undefined;
  }
}
