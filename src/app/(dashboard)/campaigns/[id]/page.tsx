'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Send, 
  Users, 
  Mail, 
  MessageSquare,
  BarChart3,
  Eye,
  MousePointerClick
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'COMPLETED' | 'CANCELLED';
  targetAudience?: string;
  subject?: string;
  content?: string;
  scheduledFor?: string;
  sentAt?: string;
  statistics?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
  };
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  SENDING: 'bg-yellow-100 text-yellow-800',
  SENT: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { handleError } = useErrorHandler();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaign();
  }, [params.id]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/campaigns/${params.id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Campaign not found');
          router.push('/dashboard/campaigns');
          return;
        }
        throw new Error('Failed to fetch campaign');
      }

      const data = await response.json();
      setCampaign(data.campaign || data.data || data);
    } catch (error) {
      handleError(error, 'Fetch campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!confirm('Send this campaign now?')) return;

    try {
      const response = await fetch(`/api/campaigns/${params.id}/send`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to send campaign');

      toast.success('Campaign is being sent');
      await fetchCampaign();
    } catch (error) {
      handleError(error, 'Send campaign');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this campaign? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/campaigns/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete campaign');

      toast.success('Campaign deleted successfully');
      router.push('/dashboard/campaigns');
    } catch (error) {
      handleError(error, 'Delete campaign');
    }
  };

  if (loading) {
    return <PageLoader text="Loading campaign..." />;
  }

  if (!campaign) {
    return (
      <div className="p-6">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4">Campaign Not Found</h1>
          <Button onClick={() => router.push('/dashboard/campaigns')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Button>
        </div>
      </div>
    );
  }

  const stats = campaign.statistics;

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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{campaign.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {campaign.type} Campaign · Created {formatDate(campaign.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {campaign.status === 'DRAFT' && (
            <>
              <Button variant="outline" onClick={() => router.push(`/dashboard/campaigns/${params.id}/edit`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button onClick={handleSend}>
                <Send className="w-4 h-4 mr-2" />
                Send Now
              </Button>
            </>
          )}
          {campaign.status !== 'SENDING' && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div>
        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${statusColors[campaign.status]}`}>
          {campaign.status}
        </span>
      </div>

      {/* Campaign Statistics */}
      {stats && campaign.status !== 'DRAFT' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.sent}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Sent</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Mail className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.delivered}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Delivered ({stats.sent > 0 ? ((stats.delivered / stats.sent) * 100).toFixed(1) : 0}%)
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.opened}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Opened ({stats.delivered > 0 ? ((stats.opened / stats.delivered) * 100).toFixed(1) : 0}%)
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <MousePointerClick className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.clicked}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Clicked ({stats.opened > 0 ? ((stats.clicked / stats.opened) * 100).toFixed(1) : 0}%)
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.converted}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Converted ({stats.clicked > 0 ? ((stats.converted / stats.clicked) * 100).toFixed(1) : 0}%)
            </p>
          </div>
        </div>
      )}

      {/* Campaign Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Campaign Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-600 dark:text-gray-400">Name</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{campaign.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 dark:text-gray-400">Type</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{campaign.type}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 dark:text-gray-400">Status</dt>
              <dd className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${statusColors[campaign.status]}`}>
                {campaign.status}
              </dd>
            </div>
            {campaign.targetAudience && (
              <div>
                <dt className="text-sm text-gray-600 dark:text-gray-400">Target Audience</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{campaign.targetAudience}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Timeline</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-600 dark:text-gray-400">Created</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{formatDate(campaign.createdAt)}</dd>
            </div>
            {campaign.scheduledFor && (
              <div>
                <dt className="text-sm text-gray-600 dark:text-gray-400">Scheduled For</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{formatDate(campaign.scheduledFor)}</dd>
              </div>
            )}
            {campaign.sentAt && (
              <div>
                <dt className="text-sm text-gray-600 dark:text-gray-400">Sent At</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{formatDate(campaign.sentAt)}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Campaign Content */}
      {campaign.subject && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Subject</h2>
          <p className="text-gray-900 dark:text-white font-medium">{campaign.subject}</p>
        </div>
      )}

      {campaign.content && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Content</h2>
          <div className="prose max-w-none dark:prose-invert">
            <div dangerouslySetInnerHTML={{ __html: campaign.content }} />
          </div>
        </div>
      )}
    </div>
  );
}

