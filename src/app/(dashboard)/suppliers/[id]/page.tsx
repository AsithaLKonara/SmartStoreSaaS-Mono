'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, Building, Mail, Phone, MapPin, DollarSign, Star } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface Supplier {
  id: string;
  code: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: any;
  paymentTerms?: string;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  rating?: number;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  SUSPENDED: 'bg-red-100 text-red-800',
};

export default function SupplierDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { handleError } = useErrorHandler();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSupplier();
  }, [params.id]);

  const fetchSupplier = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/suppliers/${params.id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Supplier not found');
          router.push('/dashboard/procurement/suppliers');
          return;
        }
        throw new Error('Failed to fetch supplier');
      }

      const data = await response.json();
      setSupplier(data.supplier || data.data || data);
    } catch (error) {
      handleError(error, 'Fetch supplier');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this supplier? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/suppliers/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete supplier');

      toast.success('Supplier deleted successfully');
      router.push('/dashboard/procurement/suppliers');
    } catch (error) {
      handleError(error, 'Delete supplier');
    }
  };

  if (loading) {
    return <PageLoader text="Loading supplier..." />;
  }

  if (!supplier) {
    return (
      <div className="p-6">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4">Supplier Not Found</h1>
          <Button onClick={() => router.push('/dashboard/procurement/suppliers')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Suppliers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{supplier.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">Code: {supplier.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      <div>
        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${statusColors[supplier.status]}`}>
          {supplier.status}
        </span>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
          <dl className="space-y-3">
            {supplier.contactName && (
              <div>
                <dt className="text-sm text-gray-600 dark:text-gray-400">Contact Person</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{supplier.contactName}</dd>
              </div>
            )}
            {supplier.email && (
              <div>
                <dt className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  Email
                </dt>
                <dd className="font-medium text-gray-900 dark:text-white">{supplier.email}</dd>
              </div>
            )}
            {supplier.phone && (
              <div>
                <dt className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  Phone
                </dt>
                <dd className="font-medium text-gray-900 dark:text-white">{supplier.phone}</dd>
              </div>
            )}
            {supplier.address && (
              <div>
                <dt className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  Address
                </dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {typeof supplier.address === 'string' ? supplier.address : JSON.stringify(supplier.address)}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Business Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Business Details</h2>
          <dl className="space-y-3">
            {supplier.paymentTerms && (
              <div>
                <dt className="text-sm text-gray-600 dark:text-gray-400">Payment Terms</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{supplier.paymentTerms}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-gray-600 dark:text-gray-400">Currency</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{supplier.currency}</dd>
            </div>
            {supplier.rating !== undefined && (
              <div>
                <dt className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                  <Star className="w-4 h-4 mr-1" />
                  Rating
                </dt>
                <dd className="font-medium text-yellow-600">{supplier.rating.toFixed(1)} / 5.0</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Purchase Orders</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{supplier.totalOrders}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Amount Spent</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(supplier.totalSpent)}</p>
        </div>
      </div>
    </div>
  );
}

