'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FilePlus, 
  FileText, 
  MoreVertical, 
  Eye, 
  Edit3, 
  Trash2, 
  Globe, 
  Lock
} from 'lucide-react';

interface ContentPage {
  id: string;
  title: string;
  slug: string;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  lastModified: string;
  views: number;
}

export default function CMSPagesDashboard() {
  const [pages] = useState<ContentPage[]>([
    { id: '1', title: 'About Our Brand', slug: '/about', status: 'PUBLISHED', lastModified: '2 days ago', views: 1240 },
    { id: '2', title: 'Privacy Policy', slug: '/privacy', status: 'PUBLISHED', lastModified: '1 month ago', views: 450 },
    { id: '3', title: 'Summer Collection 2026', slug: '/summer-26', status: 'DRAFT', lastModified: '1 hour ago', views: 0 },
    { id: '4', title: 'Terms of Service', slug: '/terms', status: 'PUBLISHED', lastModified: '1 month ago', views: 120 },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
          <p className="text-slate-500">Create and manage your brand's unique pages and storytelling assets.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <FilePlus className="w-4 h-4 mr-2" />
          Create New Page
        </Button>
      </div>

      <div className="grid gap-4">
        {pages.map((page) => (
          <Card key={page.id} className="group hover:border-indigo-200 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="p-3 bg-slate-50 rounded-lg text-slate-400 group-hover:text-indigo-600 transition-colors">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="font-bold text-slate-900">{page.title}</h3>
                    <Badge variant={page.status === 'PUBLISHED' ? 'default' : 'secondary'} className={page.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : ''}>
                      {page.status === 'PUBLISHED' ? (
                        <Globe className="w-3 h-3 mr-1" />
                      ) : (
                        <Lock className="w-3 h-3 mr-1" />
                      )}
                      {page.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    Slug: <span className="font-mono text-indigo-600">{page.slug}</span> • Last modified {page.lastModified}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="hidden lg:flex flex-col items-end mr-6 border-r pr-6 border-slate-100">
                  <p className="text-lg font-bold text-slate-900">{page.views.toLocaleString()}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total Views</p>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="icon" className="hover:text-indigo-600 hover:bg-indigo-50">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:text-indigo-600 hover:bg-indigo-50">
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:text-rose-600 hover:bg-rose-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
