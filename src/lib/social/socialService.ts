// Social Commerce Integration Service
export interface SocialPlatform {
  id: string;
  name: string;
  type: 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK' | 'WHATSAPP';
  isConnected: boolean;
}

export class SocialCommerceService {
  private platforms: Map<string, SocialPlatform> = new Map();

  constructor() {
    this.initializePlatforms();
  }

  private initializePlatforms() {
    const platforms = [
      { id: 'facebook', name: 'Facebook', type: 'FACEBOOK' as const, isConnected: false },
      { id: 'instagram', name: 'Instagram', type: 'INSTAGRAM' as const, isConnected: false },
      { id: 'tiktok', name: 'TikTok', type: 'TIKTOK' as const, isConnected: false },
      { id: 'whatsapp', name: 'WhatsApp Business', type: 'WHATSAPP' as const, isConnected: false }
    ];

    platforms.forEach(platform => {
      this.platforms.set(platform.id, platform);
    });
  }

  async connectPlatform(platformId: string): Promise<boolean> {
    const platform = this.platforms.get(platformId);
    if (!platform) return false;

    platform.isConnected = true;
    return true;
  }

  getConnectedPlatforms(): SocialPlatform[] {
    return Array.from(this.platforms.values()).filter(p => p.isConnected);
  }

  getAllPlatforms(): SocialPlatform[] {
    return Array.from(this.platforms.values());
  }
}

export const socialCommerceService = new SocialCommerceService();
export interface SocialPlatform {
  id: string;
  name: string;
  type: 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK' | 'WHATSAPP';
  isConnected: boolean;
}

export class SocialCommerceService {
  private platforms: Map<string, SocialPlatform> = new Map();

  constructor() {
    this.initializePlatforms();
  }

  private initializePlatforms() {
    const platforms = [
      { id: 'facebook', name: 'Facebook', type: 'FACEBOOK' as const, isConnected: false },
      { id: 'instagram', name: 'Instagram', type: 'INSTAGRAM' as const, isConnected: false },
      { id: 'tiktok', name: 'TikTok', type: 'TIKTOK' as const, isConnected: false },
      { id: 'whatsapp', name: 'WhatsApp Business', type: 'WHATSAPP' as const, isConnected: false }
    ];

    platforms.forEach(platform => {
      this.platforms.set(platform.id, platform);
    });
  }

  async connectPlatform(platformId: string): Promise<boolean> {
    const platform = this.platforms.get(platformId);
    if (!platform) return false;

    platform.isConnected = true;
    return true;
  }

  getConnectedPlatforms(): SocialPlatform[] {
    return Array.from(this.platforms.values()).filter(p => p.isConnected);
  }

  getAllPlatforms(): SocialPlatform[] {
    return Array.from(this.platforms.values());
  }
}

export const socialCommerceService = new SocialCommerceService();
export interface SocialPlatform {
  id: string;
  name: string;
  type: 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK' | 'WHATSAPP';
  isConnected: boolean;
}

export class SocialCommerceService {
  private platforms: Map<string, SocialPlatform> = new Map();

  constructor() {
    this.initializePlatforms();
  }

  private initializePlatforms() {
    const platforms = [
      { id: 'facebook', name: 'Facebook', type: 'FACEBOOK' as const, isConnected: false },
      { id: 'instagram', name: 'Instagram', type: 'INSTAGRAM' as const, isConnected: false },
      { id: 'tiktok', name: 'TikTok', type: 'TIKTOK' as const, isConnected: false },
      { id: 'whatsapp', name: 'WhatsApp Business', type: 'WHATSAPP' as const, isConnected: false }
    ];

    platforms.forEach(platform => {
      this.platforms.set(platform.id, platform);
    });
  }

  async connectPlatform(platformId: string): Promise<boolean> {
    const platform = this.platforms.get(platformId);
    if (!platform) return false;

    platform.isConnected = true;
    return true;
  }

  getConnectedPlatforms(): SocialPlatform[] {
    return Array.from(this.platforms.values()).filter(p => p.isConnected);
  }

  getAllPlatforms(): SocialPlatform[] {
    return Array.from(this.platforms.values());
  }
}

export const socialCommerceService = new SocialCommerceService();
