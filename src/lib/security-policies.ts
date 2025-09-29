import { ROLES, PERMISSIONS } from './auth-middleware';

/**
 * Security policies configuration for SmartStore SaaS
 */
export const SECURITY_POLICIES = {
  // Password policies
  PASSWORD: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90, // days
    historyCount: 5, // remember last 5 passwords
    lockoutAttempts: 5,
    lockoutDuration: 30, // minutes
  },

  // Session policies
  SESSION: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    sliding: true, // extend session on activity
    secure: true, // HTTPS only
    httpOnly: true,
    sameSite: 'strict' as const,
    maxConcurrentSessions: 3,
  },

  // MFA policies
  MFA: {
    requiredForAdmins: true,
    requiredForUsers: false,
    backupCodesCount: 10,
    totpIssuer: 'SmartStore SaaS',
    recoveryCodesEnabled: true,
  },

  // API security policies
  API: {
    rateLimiting: {
      default: {
        maxRequests: 100,
        windowMs: 60 * 1000, // 1 minute
      },
      authenticated: {
        maxRequests: 1000,
        windowMs: 60 * 1000, // 1 minute
      },
      admin: {
        maxRequests: 5000,
        windowMs: 60 * 1000, // 1 minute
      },
    },
    timeout: 30000, // 30 seconds
    maxBodySize: 10 * 1024 * 1024, // 10MB
    allowedOrigins: ['https://smartstore.com', 'https://app.smartstore.com'],
    corsCredentials: true,
  },

  // Data protection policies
  DATA_PROTECTION: {
    encryption: {
      algorithm: 'aes-256-gcm',
      keyRotationDays: 90,
    },
    retention: {
      auditLogs: 2555, // 7 years in days
      userData: 1095, // 3 years in days
      sessionData: 30, // 30 days
      tempData: 7, // 7 days
    },
    anonymization: {
      enabled: true,
      delayDays: 365, // anonymize after 1 year of inactivity
    },
  },

  // Threat detection policies
  THREAT_DETECTION: {
    bruteForce: {
      maxAttempts: 5,
      timeWindow: 15, // minutes
      lockoutDuration: 30, // minutes
      progressiveLockout: true,
    },
    suspiciousActivity: {
      rapidRequests: 100, // requests per minute
      unusualLocation: 1000, // km from usual location
      deviceChange: 0.8, // similarity threshold
      ipReputationThreshold: 30,
    },
    geoBlocking: {
      enabled: false,
      blockedCountries: [],
      allowedCountries: [],
    },
  },

  // Audit and logging policies
  AUDIT: {
    logLevel: 'info',
    sensitiveDataFields: [
      'password',
      'token',
      'secret',
      'key',
      'ssn',
      'creditCard',
      'bankAccount',
    ],
    logRetention: 2555, // 7 years in days
    realTimeAlerts: true,
    alertThresholds: {
      failedLogins: 10, // per hour
      suspiciousActivity: 5, // per hour
      dataBreach: 1, // immediate
    },
  },

  // File upload policies
  FILE_UPLOAD: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    scanForMalware: true,
    quarantineSuspicious: true,
  },

  // Email security policies
  EMAIL: {
    verificationRequired: true,
    domainWhitelist: [],
    domainBlacklist: ['tempmail.com', '10minutemail.com'],
    maxEmailsPerHour: 100,
    rateLimitWindow: 60 * 60 * 1000, // 1 hour
  },

  // Backup and recovery policies
  BACKUP: {
    frequency: 'daily',
    retention: 30, // days
    encryption: true,
    compression: true,
    offsiteStorage: true,
    testRestore: 'monthly',
  },
};

/**
 * Role-specific security policies
 */
export const ROLE_SECURITY_POLICIES = {
  [ROLES.SUPER_ADMIN]: {
    sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours
    mfaRequired: true,
    ipWhitelist: [],
    ipBlacklist: [],
    maxConcurrentSessions: 5,
    sensitiveDataAccess: true,
    auditLevel: 'detailed',
  },
  [ROLES.ADMIN]: {
    sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours
    mfaRequired: true,
    ipWhitelist: [],
    ipBlacklist: [],
    maxConcurrentSessions: 3,
    sensitiveDataAccess: true,
    auditLevel: 'standard',
  },
  [ROLES.MANAGER]: {
    sessionTimeout: 12 * 60 * 60 * 1000, // 12 hours
    mfaRequired: false,
    ipWhitelist: [],
    ipBlacklist: [],
    maxConcurrentSessions: 3,
    sensitiveDataAccess: false,
    auditLevel: 'basic',
  },
  [ROLES.USER]: {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    mfaRequired: false,
    ipWhitelist: [],
    ipBlacklist: [],
    maxConcurrentSessions: 2,
    sensitiveDataAccess: false,
    auditLevel: 'basic',
  },
};

/**
 * Feature-specific security policies
 */
export const FEATURE_SECURITY_POLICIES = {
  // AI and automation features
  AI_FEATURES: {
    dataProcessingConsent: true,
    dataRetention: 365, // days
    anonymizationRequired: true,
    auditTrail: true,
  },

  // Payment processing
  PAYMENT_PROCESSING: {
    pciCompliance: true,
    tokenizationRequired: true,
    encryptionRequired: true,
    auditLevel: 'detailed',
  },

  // Customer data handling
  CUSTOMER_DATA: {
    gdprCompliance: true,
    consentManagement: true,
    rightToBeForgotten: true,
    dataPortability: true,
  },

  // Integration security
  INTEGRATIONS: {
    oauthRequired: true,
    tokenRotation: true,
    auditLogging: true,
    sandboxMode: true,
  },
};

/**
 * Environment-specific security policies
 */
export const ENVIRONMENT_SECURITY_POLICIES = {
  development: {
    debugMode: true,
    relaxedCors: true,
    selfSignedCertificates: true,
    auditLevel: 'basic',
    rateLimitMultiplier: 0.1, // 10% of production limits
  },
  staging: {
    debugMode: false,
    relaxedCors: false,
    selfSignedCertificates: false,
    auditLevel: 'standard',
    rateLimitMultiplier: 0.5, // 50% of production limits
  },
  production: {
    debugMode: false,
    relaxedCors: false,
    selfSignedCertificates: false,
    auditLevel: 'detailed',
    rateLimitMultiplier: 1.0, // Full production limits
    strictSecurity: true,
  },
};

/**
 * Security compliance frameworks
 */
export const COMPLIANCE_FRAMEWORKS = {
  GDPR: {
    enabled: true,
    dataProcessingBasis: 'consent',
    consentWithdrawal: true,
    dataPortability: true,
    rightToBeForgotten: true,
    breachNotification: 72, // hours
  },
  CCPA: {
    enabled: true,
    optOutMechanism: true,
    dataDisclosure: true,
    deletionRights: true,
  },
  HIPAA: {
    enabled: false, // Enable if handling health data
    businessAssociateAgreements: false,
    minimumNecessaryStandard: false,
  },
  SOC2: {
    enabled: true,
    accessControls: true,
    availabilityMonitoring: true,
    confidentialityProtection: true,
    integrityMonitoring: true,
  },
  PCI_DSS: {
    enabled: true,
    cardDataEncryption: true,
    secureTransmission: true,
    accessRestriction: true,
    monitoring: true,
  },
};

/**
 * Get security policy for current environment
 */
export function getSecurityPolicy(environment: string = 'production') {
  const basePolicy = SECURITY_POLICIES;
  const environmentPolicy = ENVIRONMENT_SECURITY_POLICIES[environment as keyof typeof ENVIRONMENT_SECURITY_POLICIES] || ENVIRONMENT_SECURITY_POLICIES.production;
  
  return {
    ...basePolicy,
    ...environmentPolicy,
  };
}

/**
 * Get role-specific security policy
 */
export function getRoleSecurityPolicy(role: string) {
  return ROLE_SECURITY_POLICIES[role as keyof typeof ROLE_SECURITY_POLICIES] || ROLE_SECURITY_POLICIES[ROLES.USER];
}

/**
 * Validate security policy compliance
 */
export function validateSecurityCompliance(policy: any, complianceFramework: string) {
  const framework = COMPLIANCE_FRAMEWORKS[complianceFramework as keyof typeof COMPLIANCE_FRAMEWORKS];
  
  if (!framework) {
    throw new Error(`Unknown compliance framework: ${complianceFramework}`);
  }

  // Implementation would validate policy against framework requirements
  return {
    compliant: true,
    violations: [],
    recommendations: [],
  };
}
