'use client';

import React, { useState } from 'react';
import { 
  Cpu, 
  ArrowLeft, 
  Sliders, 
  Settings2, 
  Zap, 
  ShieldCheck, 
  BarChart3,
  Bot,
  Save,
  RefreshCw,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AIConfigurationPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [churnThreshold, setChurnThreshold] = useState([75]);
  const [inventoryBuffer, setInventoryBuffer] = useState([15]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Neural engine parameters synchronized');
    } catch (error) {
      toast.error('Failed to update prediction weights');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest transition-all">
            <ArrowLeft className="w-4 h-4" /> System Intelligence
          </Link>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
             <Cpu className="w-8 h-8 text-indigo-500" />
             Prediction Engine Tuning
          </h1>
          <p className="text-slate-400 mt-1">Configure ML model thresholds and sensitivity for automated platform decisioning.</p>
        </div>
        <Button 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-4 rounded-xl shadow-lg shadow-indigo-600/20 h-auto"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? <RefreshCw className="w-5 h-5 mr-3 animate-spin" /> : <Save className="w-5 h-5 mr-3" />}
          Apply Parameters
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           {/* Model Selection */}
           <div className="bg-slate-900 rounded-[2.5rem] border border-white/5 p-8 shadow-2xl space-y-8">
              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2">
                   <Bot className="w-4 h-4" />
                   Primary Model Configuration
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <Label className="text-xs font-bold text-slate-300">Active Inference Model</Label>
                      <Select defaultValue="neural-v4">
                        <SelectTrigger className="bg-white/5 border-white/5 text-white h-12 rounded-xl">
                          <SelectValue placeholder="Select context" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10 text-white">
                          <SelectItem value="neural-v4">SmartStore Neural v4.2 (Stable)</SelectItem>
                          <SelectItem value="neural-v5-beta">SmartStore Neural v5.0 (Experimental)</SelectItem>
                          <SelectItem value="legacy-linear">Legacy Linear Regressor</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Stable models prioritize precision over recall. Recommended for high-value SKU environments.</p>
                   </div>

                   <div className="space-y-4">
                      <Label className="text-xs font-bold text-slate-300">Data Retraining Frequency</Label>
                      <Select defaultValue="daily">
                        <SelectTrigger className="bg-white/5 border-white/5 text-white h-12 rounded-xl">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10 text-white">
                          <SelectItem value="realtime">Continuous Stream (Real-time)</SelectItem>
                          <SelectItem value="daily">Daily Batch Sync</SelectItem>
                          <SelectItem value="weekly">Weekly Comprehensive Retrain</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Real-time sync may increase API latency during peak traffic hours.</p>
                   </div>
                </div>
              </div>

              {/* Threshold Sliders */}
              <div className="space-y-12 pt-8 border-t border-white/5">
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <Label className="text-xs font-bold text-slate-300">Churn Prediction Sensitivity</Label>
                       <span className="text-sm font-black text-indigo-400">{churnThreshold}%</span>
                    </div>
                    <Slider 
                      value={churnThreshold} 
                      onValueChange={setChurnThreshold} 
                      max={100} 
                      step={1} 
                      className="py-4"
                    />
                    <div className="flex items-start gap-4 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                       <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                       <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Lowering this threshold increases the number of "At-Risk" alerts, potentially including loyal customers in retention campaigns.</p>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <Label className="text-xs font-bold text-slate-300">Inventory Anomaly Buffer</Label>
                       <span className="text-sm font-black text-emerald-400">+{inventoryBuffer}%</span>
                    </div>
                    <Slider 
                      value={inventoryBuffer} 
                      onValueChange={setInventoryBuffer} 
                      max={50} 
                      step={1} 
                      className="py-4"
                    />
                    <p className="text-[10px] text-slate-500 font-medium">Safety stock percentage applied to AI-suggested reorder quantities.</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-widest opacity-80">Telemetry Stats</h3>
                  <BarChart3 className="w-5 h-5 opacity-60" />
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-xs font-bold">
                      <span className="opacity-70">Prediction Accuracy</span>
                      <span>96.4%</span>
                   </div>
                   <div className="flex justify-between items-center text-xs font-bold">
                      <span className="opacity-70">Model Latency</span>
                      <span>42ms</span>
                   </div>
                </div>
                <div className="pt-4">
                   <Button variant="ghost" className="w-full bg-white/10 hover:bg-white/20 text-white font-black rounded-xl">
                      View Model Logs
                   </Button>
                </div>
              </div>
           </div>

           <div className="bg-slate-900 rounded-[2rem] border border-white/5 p-8 space-y-6">
              <div className="flex items-center gap-3">
                 <ShieldCheck className="w-5 h-5 text-emerald-500" />
                 <h3 className="text-sm font-black text-white">Governance</h3>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Changes to core neural parameters are audited and logged for multi-tenant accountability. Ensure compliance with data privacy standards.</p>
              <div className="pt-4 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-indigo-400">
                 System Policy v1.2 <Sliders className="w-3 h-3" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
