'use client';

import React from 'react';
import { CheckCircle2, Circle, Clock, Package, Truck, MapPin, ShieldCheck } from 'lucide-react';

interface TrackingEvent {
  status: string;
  location: string;
  timestamp: string;
  description: string;
  isCompleted: boolean;
  isCurrent?: boolean;
}

interface TrackingTimelineProps {
  events: TrackingEvent[];
}

export const TrackingTimeline: React.FC<TrackingTimelineProps> = ({ events }) => {
  return (
    <div className="space-y-8 relative">
      {/* Connector Line */}
      <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-800" />

      {events.map((event, index) => (
        <div key={index} className="relative pl-12 group">
          {/* Status Icon */}
          <div className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${
            event.isCompleted 
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
              : event.isCurrent
                ? 'bg-indigo-600 text-white animate-pulse shadow-lg shadow-indigo-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}>
            {event.isCompleted ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : event.isCurrent ? (
              <Package className="w-5 h-5" />
            ) : (
              <Circle className="w-3 h-3 fill-current" />
            )}
          </div>

          {/* Content */}
          <div className={`p-4 rounded-2xl border transition-all duration-300 ${
            event.isCurrent 
              ? 'bg-indigo-600/5 border-indigo-500/20 shadow-sm' 
              : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <h4 className={`font-black uppercase tracking-widest text-xs ${
                event.isCurrent ? 'text-indigo-600' : event.isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-400'
              }`}>
                {event.status}
              </h4>
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {event.timestamp}
              </span>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
              {event.description}
            </p>

            <div className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg w-fit">
              <MapPin className="w-3 h-3 text-rose-500" />
              {event.location}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
