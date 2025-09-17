import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Home, ArrowLeft, Search, ShoppingBag } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* 404 Icon */}
        <div className="mx-auto h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center">
          <ShoppingBag className="h-12 w-12 text-blue-600" />
        </div>
        
        {/* Error Message */}
        <div>
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for. 
            It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button className="w-full sm:w-auto">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              className="w-full sm:w-auto"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
          
          <div className="pt-4">
            <Link 
              href="/dashboard" 
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Or go to Dashboard
            </Link>
          </div>
        </div>
        
        {/* Help Section */}
        <div className="pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            Need help? Try these popular pages:
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-500">
              Dashboard
            </Link>
            <Link href="/products" className="text-blue-600 hover:text-blue-500">
              Products
            </Link>
            <Link href="/customers" className="text-blue-600 hover:text-blue-500">
              Customers
            </Link>
            <Link href="/orders" className="text-blue-600 hover:text-blue-500">
              Orders
            </Link>
            <Link href="/analytics" className="text-blue-600 hover:text-blue-500">
              Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
