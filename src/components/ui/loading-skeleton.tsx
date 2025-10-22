'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
    />
  );
};

export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => {
  return (
    <div className="space-y-2">
      {/* Table header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-10 flex-1" />
        ))}
      </div>
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-12 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="rounded-lg border p-6 space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-20 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
};

export const FormSkeleton = () => {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32" />
    </div>
  );
};

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={`stat-${i}`} className="h-32" />
        ))}
      </div>
      {/* Chart */}
      <Skeleton className="h-80 w-full" />
      {/* Table */}
      <TableSkeleton rows={5} columns={4} />
    </div>
  );
};

