'use client';

import React, { useEffect, useRef } from 'react';

interface TurnstileProps {
  onVerify: (token: string) => void;
  options?: {
    theme?: 'light' | 'dark' | 'auto';
    size?: 'normal' | 'compact';
  };
}

declare global {
  interface Window {
    turnstile: any;
  }
}

export default function TurnstileWidget({ onVerify, options = {} }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!;
    
    if (!siteKey) {
      console.warn('Turnstile site key missing');
      return;
    }

    const loadTurnstile = () => {
      if (window.turnstile && containerRef.current && !widgetIdRef.current) {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: onVerify,
          theme: options.theme || 'dark',
          size: options.size || 'normal',
        });
      }
    };

    if (window.turnstile) {
      loadTurnstile();
    } else {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      script.onload = loadTurnstile;
      document.body.appendChild(script);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onVerify, options]);

  return <div ref={containerRef} className="flex justify-center my-4" />;
}
