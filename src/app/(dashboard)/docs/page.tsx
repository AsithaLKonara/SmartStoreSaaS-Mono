'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';
import { Book, Terminal, Shield, Code } from 'lucide-react';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-[500px] text-white">Loading API documentation...</div>
});

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-[#0e0918] text-white p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Book className="w-10 h-10 text-primary" />
            Developer Sandbox
          </h1>
          <p className="text-slate-400">
            Interactive OpenAPI documentation and live API playground.
          </p>
        </div>
        
        <div className="flex gap-2">
          <div className="glass-dark px-4 py-2 rounded-lg border border-white/10 flex items-center gap-2 text-xs font-mono text-primary">
            <Terminal className="w-4 h-4" />
            v1.2.2-stable
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Info */}
        <div className="space-y-6">
           <div className="glass-dark rounded-xl border border-white/10 p-6 space-y-4">
              <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-widest text-primary">
                <Shield className="w-4 h-4" /> Authentication
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Most endpoints require a Bearer Token. You can obtain your token from the Security settings or by inspecting the session headers.
              </p>
           </div>
           
           <div className="glass-dark rounded-xl border border-white/10 p-6 space-y-4">
              <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-widest text-primary">
                <Code className="w-4 h-4" /> Multi-Tenancy
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Include `x-tenant-id` header to scope searches to a specific organization. Super Admins can access all tenant data.
              </p>
           </div>
        </div>

        {/* Swagger UI Main */}
        <div className="lg:col-span-3">
          <div className="glass-dark rounded-2xl border border-white/10 overflow-hidden shadow-2xl bg-white shadow-primary/5">
            <style jsx global>{`
              .swagger-ui {
                background-color: white !important;
                padding: 20px;
              }
              .swagger-ui .info .title {
                color: #0e0918 !important;
              }
              .swagger-ui .scheme-container {
                background-color: #f8fafc !important;
                box-shadow: none !important;
                border: 1px solid #e2e8f0;
                margin: 20px;
                border-radius: 8px;
              }
              /* Customize Swagger colors to match SmartStore primary if needed */
            `}</style>
            <SwaggerUI url="/api/docs" />
          </div>
        </div>
      </div>
    </div>
  );
}
