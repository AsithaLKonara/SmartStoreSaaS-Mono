'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Star,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  ThumbsUp,
  BarChart3
} from 'lucide-react';

interface Review {
  id: string;
  productName: string;
  productId: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  reviewText: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM';
  createdAt: string;
  response?: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('PENDING');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [response, setResponse] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reviews?status=${filter}`);
      
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      } else {
        // Mock data
        setReviews([
          {
            id: 'rev_001',
            productName: 'Premium Laptop',
            productId: 'prod_123',
            customerName: 'John Doe',
            customerEmail: 'john@example.com',
            rating: 5,
            reviewText: 'Excellent product! Fast delivery and great quality.',
            status: 'PENDING',
            createdAt: new Date().toISOString()
          },
          {
            id: 'rev_002',
            productName: 'Wireless Mouse',
            productId: 'prod_124',
            customerName: 'Jane Smith',
            customerEmail: 'jane@example.com',
            rating: 4,
            reviewText: 'Good product, but battery life could be better.',
            status: 'PENDING',
            createdAt: new Date().toISOString()
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/approve`, {
        method: 'PUT',
      });

      if (response.ok) {
        alert('Review approved!');
        fetchReviews();
      }
    } catch (error) {
      alert('Error approving review');
    }
  };

  const handleReject = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/reject`, {
        method: 'PUT',
      });

      if (response.ok) {
        alert('Review rejected');
        fetchReviews();
      }
    } catch (error) {
      alert('Error rejecting review');
    }
  };

  const handleSpam = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/spam`, {
        method: 'PUT',
      });

      if (response.ok) {
        alert('Marked as spam');
        fetchReviews();
      }
    } catch (error) {
      alert('Error marking as spam');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => r.status === 'PENDING').length,
    approved: reviews.filter(r => r.status === 'APPROVED').length,
    rejected: reviews.filter(r => r.status === 'REJECTED').length,
    avgRating: reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0',
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Reviews Management</h1>
          <p className="text-gray-400 mt-2">
            Moderate and manage product reviews
          </p>
        </div>
        <Badge className="text-lg px-4 py-2">
          {stats.pending} Pending Review
        </Badge>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-gray-400 mt-1">Total Reviews</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <p className="text-2xl font-bold text-yellow-400">{stats.avgRating}</p>
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              </div>
              <p className="text-sm text-gray-400 mt-1">Avg Rating</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              <p className="text-sm text-gray-400 mt-1">Pending</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
              <p className="text-sm text-gray-400 mt-1">Approved</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
              <p className="text-sm text-gray-400 mt-1">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="pt-6">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All Reviews
            </Button>
            <Button
              variant={filter === 'PENDING' ? 'default' : 'outline'}
              onClick={() => setFilter('PENDING')}
            >
              Pending ({stats.pending})
            </Button>
            <Button
              variant={filter === 'APPROVED' ? 'default' : 'outline'}
              onClick={() => setFilter('APPROVED')}
            >
              Approved
            </Button>
            <Button
              variant={filter === 'REJECTED' ? 'default' : 'outline'}
              onClick={() => setFilter('REJECTED')}
            >
              Rejected
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Customer Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="text-white font-medium">{review.productName}</p>
                        {renderStars(review.rating)}
                      </div>
                      <p className="text-sm text-gray-400">
                        by {review.customerName} • {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        review.status === 'APPROVED' ? 'default' :
                        review.status === 'REJECTED' ? 'destructive' :
                        'secondary'
                      }
                    >
                      {review.status}
                    </Badge>
                  </div>

                  <p className="text-gray-300 mb-3">{review.reviewText}</p>

                  {review.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(review.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(review.id)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSpam(review.id)}
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Mark as Spam
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Star className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No reviews found</p>
              <p className="text-sm mt-2">Customer reviews will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

