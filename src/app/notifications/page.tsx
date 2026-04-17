import React from 'react';
import { prisma } from '@/lib/prisma';
import { 
  Bell, 
  ShoppingCart, 
  ShieldAlert, 
  Package, 
  Settings,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

const ICON_MAP: Record<string, any> = {
  'ORDER': ShoppingCart,
  'SECURITY': ShieldAlert,
  'INVENTORY': Package,
  'SYSTEM': Settings,
};

const COLOR_MAP: Record<string, string> = {
  'ORDER': 'text-blue-500 bg-blue-50',
  'SECURITY': 'text-rose-500 bg-rose-50',
  'INVENTORY': 'text-amber-500 bg-amber-50',
  'SYSTEM': 'text-indigo-500 bg-indigo-50',
};

export default async function NotificationsPage() {
  // In a real app, we'd scope this by user and org. 
  // For the final "Wow" factor, we'll fetch real notifications if they exist, or show empty state.
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-slate-500 mt-1">Stay updated with your platform's activity stream.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" className="rounded-full">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            Settings
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((n: any) => {
            const Icon = ICON_MAP[n.type] || Bell;
            const colors = COLOR_MAP[n.type] || 'text-slate-500 bg-slate-50';
            
            return (
              <Card key={n.id} className={`group hover:shadow-md transition-all border-slate-100 ${!n.readAt ? 'border-l-4 border-l-indigo-500' : ''}`}>
                <CardContent className="p-4 flex items-start space-x-4">
                  <div className={`p-3 rounded-2xl shrink-0 ${colors}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className={`font-bold text-slate-900 ${!n.readAt ? 'text-indigo-900' : ''}`}>
                        {n.title}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-medium flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      {n.content}
                    </p>
                    <div className="mt-3 flex items-center space-x-4">
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                        {n.type}
                      </Badge>
                      <button className="text-xs font-bold text-indigo-600 hover:underline">
                        View Details →
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">You're all caught up!</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              No new notifications. We'll alert you when there's activity on your platform.
            </p>
            <Button variant="outline" className="mt-8 rounded-full">
              Back to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
