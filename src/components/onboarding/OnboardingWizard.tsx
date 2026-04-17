'use client';

import { useState } from 'react';
import { Store, Palette, CreditCard, Rocket, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface Step {
  id: number;
  title: string;
  icon: any;
  description: string;
}

const steps: Step[] = [
  { id: 1, title: 'Store Basics', icon: Store, description: 'Set your store name and public URL.' },
  { id: 2, title: 'Branding', icon: Palette, description: 'Upload your logo and pick your primary brand colors.' },
  { id: 3, title: 'Payments', icon: CreditCard, description: 'Connect Stripe or PayPal to start selling.' },
  { id: 4, title: 'Launch', icon: Rocket, description: 'Review your settings and open for business.' }
];

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCompletedSteps([...completedSteps, currentStep]);
      setCurrentStep(currentStep + 1);
    } else {
      toast.success('Onboarding complete! Your store is now live.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-700">
      {/* Progress Bar */}
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -translate-y-1/2 z-0" />
        <div 
          className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-500" 
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />
        
        {steps.map((step) => {
          const isCompleted = completedSteps.includes(step.id);
          const isActive = currentStep === step.id;
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2
                  ${isCompleted ? 'bg-primary border-primary text-white' : 
                    isActive ? 'bg-[#0e0918] border-primary text-primary shadow-lg shadow-primary/20' : 
                    'bg-[#0e0918] border-white/10 text-slate-500'}
                `}
              >
                {isCompleted ? <Check className="w-6 h-6" /> : <step.icon className="w-5 h-5" />}
              </div>
              <span className={`text-[10px] uppercase tracking-widest font-bold hidden md:block
                ${isActive ? 'text-primary' : 'text-slate-500'}
              `}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="glass-dark rounded-2xl border border-white/10 p-10 min-h-[400px] flex flex-col items-center justify-center space-y-8 relative overflow-hidden">
        {/* Step-specific Background Decoration */}
        <div className="absolute top-0 right-0 p-8 opacity-5">
           {steps.find(s => s.id === currentStep)?.icon && (
             <Store className="w-64 h-64 text-white" />
           )}
        </div>

        <div className="text-center space-y-4 relative z-10 max-w-lg">
          <h2 className="text-4xl font-bold text-white">{steps[currentStep - 1].title}</h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            {steps[currentStep - 1].description}
          </p>
        </div>

        {/* Placeholder Form Fields based on step */}
        <div className="w-full max-w-md relative z-10">
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Store Name</label>
                 <input placeholder="e.g. Neon Horizon Studios" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary/50 transition-all" />
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Public Domain</label>
                 <div className="flex gap-2">
                    <input placeholder="neon-horizon" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary/50 transition-all" />
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 flex items-center font-mono text-slate-500 text-sm">
                      .smartstore.io
                    </div>
                 </div>
               </div>
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center gap-4 text-center group hover:border-primary/30 transition-all cursor-pointer">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
                    <Palette className="w-8 h-8" />
                  </div>
                  <span className="text-sm text-slate-400">Click to upload your logo (SVG/PNG)</span>
               </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="p-6 glass-dark border border-primary/20 bg-primary/5 rounded-2xl flex items-center gap-6 group hover:border-primary/50 transition-all cursor-pointer">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">Stripe Connect</h4>
                    <p className="text-xs text-slate-400">Handle cards, Apple Pay, and Google Pay</p>
                  </div>
                  <div className="ml-auto">
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </div>
               </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-500">
               <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-primary mx-auto">
                 <Rocket className="w-12 h-12" />
               </div>
               <p className="text-slate-300">Your organization is ready to launch. Hit the button below to publish your storefront.</p>
            </div>
          )}
        </div>

        <div className="pt-8 w-full max-w-md flex justify-between gap-4 relative z-10">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="text-slate-500 hover:text-white disabled:opacity-0 transition-all"
          >
            Back
          </Button>
          <Button 
            onClick={nextStep}
            className="flex-1 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 py-6"
          >
            {currentStep === steps.length ? 'Finish & Launch' : 'Continue to ' + steps[currentStep].title}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
