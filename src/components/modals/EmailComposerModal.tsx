'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Loader2, Mail, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

interface EmailComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail?: string;
  recipientName?: string;
  onSent?: () => void;
}

export function EmailComposerModal({
  isOpen,
  onClose,
  recipientEmail = '',
  recipientName = '',
  onSent,
}: EmailComposerModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    to: recipientEmail,
    toName: recipientName,
    subject: '',
    message: '',
    template: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.to || !formData.subject || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.to)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: formData.to,
          subject: formData.subject,
          message: formData.message,
          template: formData.template || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to send email');

      const data = await response.json();
      toast.success('Email sent successfully');
      
      if (onSent) onSent();
      onClose();
      
      // Reset form
      setFormData({
        to: '',
        toName: '',
        subject: '',
        message: '',
        template: '',
      });
    } catch (error) {
      logger.error({
        message: 'Email send error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { recipientEmail, recipientName }
      });
      toast.error('Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const emailTemplates = [
    { value: '', label: '-- No Template --' },
    { value: 'order_confirmation', label: 'Order Confirmation' },
    { value: 'order_shipped', label: 'Order Shipped' },
    { value: 'order_delivered', label: 'Order Delivered' },
    { value: 'payment_reminder', label: 'Payment Reminder' },
    { value: 'promotional', label: 'Promotional Offer' },
    { value: 'newsletter', label: 'Newsletter' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Compose Email
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Recipient */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="to">Recipient Email *</Label>
              <Input
                id="to"
                type="email"
                value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                placeholder="recipient@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="toName">Recipient Name</Label>
              <Input
                id="toName"
                type="text"
                value={formData.toName}
                onChange={(e) => setFormData({ ...formData, toName: e.target.value })}
                placeholder="John Doe"
              />
            </div>
          </div>

          {/* Template */}
          <div>
            <Label htmlFor="template">Email Template (Optional)</Label>
            <select
              id="template"
              value={formData.template}
              onChange={(e) => setFormData({ ...formData, template: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
            >
              {emailTemplates.map((template) => (
                <option key={template.value} value={template.value}>
                  {template.label}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Email subject..."
              required
            />
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">Message *</Label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 font-mono text-sm"
              placeholder="Type your message here..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Tip: Use variables like {'{customer.name}'} or {'{order.number}'}
            </p>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Preview</p>
            <div className="space-y-2">
              <p className="text-sm"><span className="font-semibold">To:</span> {formData.to || 'recipient@example.com'}</p>
              <p className="text-sm"><span className="font-semibold">Subject:</span> {formData.subject || '(no subject)'}</p>
              <div className="pt-2 border-t border-gray-300 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {formData.message || '(message content)'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

