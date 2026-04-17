'use client';

import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Activity, 
  AlertCircle, 
  Wifi, 
  WifiOff, 
  Battery, 
  Thermometer, 
  MapPin, 
  RotateCcw,
  Zap,
  MoreVertical,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface IoTDevice {
  id: string;
  name: string;
  type: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  location: string;
  batteryLevel: number;
  lastSeen: string;
}

interface IoTAlert {
  id: string;
  iotDeviceId: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  createdAt: string;
  iotDevice: {
    name: string;
    location: string;
  };
}

export default function IotDevicesPage() {
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [alerts, setAlerts] = useState<IoTAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIotStatus();
  }, []);

  const fetchIotStatus = async () => {
    try {
      const response = await fetch('/api/iot/status');
      if (response.ok) {
        const data = await response.json();
        setDevices(data.data.devices || []);
        setAlerts(data.data.alerts || []);
      }
    } catch (error) {
      toast.error('Failed to sync IoT mesh');
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    ONLINE: 'bg-emerald-500 shadow-emerald-500/20',
    OFFLINE: 'bg-rose-500 shadow-rose-500/20',
    MAINTENANCE: 'bg-amber-500 shadow-amber-500/20'
  };

  if (loading) return <div className="p-12 text-center text-slate-500 font-medium animate-pulse text-lg tabular-nums">Interacting with Edge Gateway...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Cpu className="w-8 h-8 text-indigo-600" />
            Device Command Center
          </h1>
          <p className="text-slate-500 mt-1">Unified monitoring and lifecycle management for warehouse IoT hardware.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="rounded-xl font-bold shadow-sm" onClick={fetchIotStatus}>
             <RotateCcw className="w-4 h-4 mr-2" /> Reboot Mesh
           </Button>
           <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md font-bold px-6 text-white border-none">
             Provision Device
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Device Grid */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
           {devices.length === 0 ? (
             <div className="col-span-full">
               <EmptyState 
                 icon={Cpu}
                 title="No Edge Devices Found"
                 description="You haven't provisioned any IoT hardware for this facility yet."
                 actionLabel="Scan for Devices"
                 onAction={() => {}} 
               />
             </div>
           ) : (
             devices.map((device) => (
               <div key={device.id} className="bg-white rounded-[2rem] border border-slate-200 p-6 hover:shadow-xl hover:border-indigo-500/50 transition-all group relative overflow-hidden">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                        device.status === 'ONLINE' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'
                      }`}>
                         {device.status === 'ONLINE' ? <Activity className="w-6 h-6 text-emerald-500" /> : <WifiOff className="w-6 h-6 text-slate-400" />}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 leading-tight">{device.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{device.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${statusColors[device.status]} shadow-lg`} />
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{device.status}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin className="w-3.5 h-3.5" /> {device.location}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Battery className={`w-3.5 h-3.5 ${device.batteryLevel < 20 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`} /> {device.batteryLevel}%
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter italic">Last Pulse: {formatDistanceToNow(new Date(device.lastSeen))} ago</p>
                       <Button size="sm" variant="ghost" className="rounded-lg h-8 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50">
                         Diagnostics
                       </Button>
                    </div>
                  </div>
               </div>
             ))
           )}
        </div>

        {/* Sidebar Alerts */}
        <div className="space-y-6">
           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl min-h-[400px]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400">Security & Health Alerts</h3>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              
              <div className="space-y-4">
                 {alerts.length === 0 ? (
                   <div className="py-12 text-center">
                     <CheckCircle2 className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                     <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-loose">Internal components optimal. No anomalies detected.</p>
                   </div>
                 ) : (
                   alerts.map((alert) => (
                     <div key={alert.id} className={`p-4 rounded-2xl border ${
                       alert.severity === 'CRITICAL' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-white/5 border-white/10'
                     }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${
                            alert.severity === 'CRITICAL' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-black'
                          }`}>
                            {alert.severity}
                          </span>
                          <span className="text-[9px] text-slate-500 font-bold">{formatDistanceToNow(new Date(alert.createdAt))} ago</span>
                        </div>
                        <p className="text-xs font-medium text-slate-300 mb-2">{alert.message}</p>
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-tighter text-slate-500">
                          <MapPin className="w-2.5 h-2.5" /> {alert.iotDevice.location}
                        </div>
                     </div>
                   ))
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
