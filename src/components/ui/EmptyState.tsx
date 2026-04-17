import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { Button } from './button';
import Link from 'next/link';

interface EmptyStateProps {
  icon: any; // Lucide icon
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-200 border-dashed rounded-3xl text-center min-h-[400px]">
      <div className="flex items-center justify-center w-20 h-20 mb-6 bg-slate-50 rounded-full border border-slate-100 shadow-sm">
        <Icon className="w-10 h-10 text-slate-400" />
      </div>
      <h3 className="mb-2 text-xl font-bold text-slate-900">{title}</h3>
      <p className="max-w-sm mb-6 text-sm text-slate-500 leading-relaxed">
        {description}
      </p>
      
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-6 py-2 shadow-md">
            {actionLabel}
          </Button>
        </Link>
      )}

      {actionLabel && onAction && !actionHref && (
        <Button onClick={onAction} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-6 py-2 shadow-md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
