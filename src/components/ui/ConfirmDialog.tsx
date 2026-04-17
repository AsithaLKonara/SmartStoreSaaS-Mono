'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Trash2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false
}: ConfirmDialogProps) {
  
  const isDanger = variant === 'danger';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden rounded-3xl border-slate-200">
        <DialogHeader className="pt-2">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4 ${isDanger ? 'bg-rose-100' : 'bg-amber-100'}`}>
            {isDanger ? (
              <Trash2 className={`h-8 w-8 text-rose-600`} />
            ) : (
              <AlertCircle className={`h-8 w-8 text-amber-600`} />
            )}
          </div>
          <DialogTitle className="text-center text-xl font-bold text-slate-900">{title}</DialogTitle>
          <DialogDescription className="text-center text-slate-500 pt-2 pb-4">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            disabled={isLoading}
            className="w-full rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
          >
            {cancelText}
          </Button>
          <Button 
            type="button" 
            variant={isDanger ? 'destructive' : 'default'} 
            onClick={onConfirm} 
            disabled={isLoading}
            className={`w-full rounded-xl font-bold text-white shadow-md ${
              isDanger 
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
            }`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
