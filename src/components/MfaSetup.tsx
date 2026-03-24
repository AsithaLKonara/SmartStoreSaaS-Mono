'use client';

import React, { useState } from 'react';
import { Shield, Key, CheckCircle2, Copy, RefreshCw, AlertTriangle, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function MfaSetup() {
  const [step, setStep] = useState<'initial' | 'qr' | 'verify' | 'success'>('initial');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const startSetup = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/mfa/setup', { method: 'POST' });
      const data = await response.json();
      if (data.qrCodeUrl) {
        setQrCodeUrl(data.qrCodeUrl);
        setSecret(data.secret);
        setStep('qr');
      } else {
        toast.error('Failed to initiate MFA setup');
      }
    } catch (error) {
      toast.error('Error starting MFA setup');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/mfa/setup/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, code: verificationCode }),
      });
      const data = await response.json();
      if (data.success) {
        setBackupCodes(data.backupCodes);
        setStep('success');
        toast.success('MFA enabled successfully!');
      } else {
        toast.error(data.error || 'Invalid code');
      }
    } catch (error) {
      toast.error('Error enabling MFA');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const downloadBackupCodes = () => {
    const element = document.createElement('a');
    const file = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'backup-codes.txt';
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="space-y-6">
      {step === 'initial' && (
        <div className="flex flex-col items-center p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Two-Factor Authentication</h3>
            <p className="text-slate-400 mt-2 max-w-sm">
              Add an extra layer of security to your account by requiring both your password and a verification code.
            </p>
          </div>
          <button
            onClick={startSetup}
            disabled={loading}
            className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all"
          >
            {loading ? 'Starting...' : 'Setup Authenticator'}
          </button>
        </div>
      )}

      {step === 'qr' && (
        <div className="space-y-6 p-4">
          <div className="flex items-center space-x-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold">1</span>
            <h3 className="text-lg font-semibold">Scan QR Code</h3>
          </div>
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-lg border-4 border-white">
              <img src={qrCodeUrl} alt="MFA QR Code" className="w-48 h-48" />
            </div>
            <p className="text-sm text-center text-slate-400 max-w-xs">
              Open your authenticator app (like Google Authenticator or Authy) and scan this QR code.
            </p>
            <div className="flex items-center space-x-2 p-3 bg-white/5 rounded-lg border border-white/10 w-full justify-between">
              <span className="font-mono text-sm truncate">{secret}</span>
              <button onClick={() => copyToClipboard(secret)} className="p-1 hover:text-primary transition-colors">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button
            onClick={() => setStep('verify')}
            className="w-full py-2 bg-primary text-white rounded-lg"
          >
            Next Step
          </button>
        </div>
      )}

      {step === 'verify' && (
        <div className="space-y-6 p-4">
          <div className="flex items-center space-x-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold">2</span>
            <h3 className="text-lg font-semibold">Verify Code</h3>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              Enter the 6-digit verification code from your authenticator app to confirm setup.
            </p>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-center text-2xl tracking-widest font-mono"
              placeholder="000000"
              maxLength={6}
            />
          </div>
          <div className="flex space-x-3">
            <button onClick={() => setStep('qr')} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all">
              Back
            </button>
            <button
              onClick={verifyAndEnable}
              disabled={loading || verificationCode.length < 6}
              className="flex-2 px-8 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Enable MFA'}
            </button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="space-y-6 p-4 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <h3 className="text-xl font-bold">MFA is Active!</h3>
          <p className="text-sm text-slate-400">
            Your account is now protected with two-factor authentication.
          </p>
          
          <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-left">
            <div className="flex items-center space-x-2 text-yellow-500 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Backup Codes</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Save these codes in a safe place. You can use them to log in if you lose access to your authenticator app.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {backupCodes.map((code, index) => (
                <div key={index} className="bg-white/5 p-2 rounded text-xs font-mono text-center">
                  {code}
                </div>
              ))}
            </div>
            <button
              onClick={downloadBackupCodes}
              className="w-full flex items-center justify-center space-x-2 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-all text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download Codes</span>
            </button>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 border border-white/10 rounded-lg hover:bg-white/5"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
