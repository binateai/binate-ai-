import { Link } from "wouter";

export default function DevNav() {
  return (
    <div className="bg-blue-100 dark:bg-blue-900 p-2 text-sm text-center">
      <div className="flex justify-center space-x-4">
        <Link href="/google-test" className="text-blue-700 dark:text-blue-300 hover:underline font-medium">
          Google OAuth Test
        </Link>
        <Link href="/app/settings" className="text-blue-700 dark:text-blue-300 hover:underline font-medium">
          Settings
        </Link>
        <Link href="/auth" className="text-blue-700 dark:text-blue-300 hover:underline font-medium">
          Auth Page
        </Link>
        <Link href="/app/dashboard" className="text-blue-700 dark:text-blue-300 hover:underline font-medium">
          Dashboard
        </Link>
        <Link href="/" className="text-blue-700 dark:text-blue-300 hover:underline font-medium">
          Landing
        </Link>
      </div>
    </div>
  );
}