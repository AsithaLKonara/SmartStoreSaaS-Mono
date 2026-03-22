'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export const GlobalBackground = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-zinc-950 pointer-events-none">
      {/* The Video loop */}
      <video
        src="/videos/14478074_1280_720_30fps.mp4"
        autoPlay
        loop
        muted
        playsInline
        onLoadedData={() => {
          console.log("PRODUCTION_DEBUG: Global background video loaded successfully");
          setIsLoaded(true);
        }}
        onError={(e) => {
          console.error("PRODUCTION_DEBUG: Global background video failed to load", e);
          const videoElement = e.currentTarget as HTMLVideoElement;
          console.log("PRODUCTION_DEBUG: Attempted source:", videoElement.src);
        }}
        className={cn(
          "absolute inset-0 w-full h-full object-cover transition-opacity duration-1000",
          isLoaded ? "opacity-40" : "opacity-20"
        )}
      />

      {/* Global Overlays for consistency */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black z-1" />
      <div className="absolute inset-0 bg-mesh opacity-20 z-0" />
    </div>
  );
};
