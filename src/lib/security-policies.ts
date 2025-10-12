export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  category: 'authentication' | 'authorization' | 'data_protection' | 'network' | 'monitoring';
  severity: 'low' | 'medium' | 'high' | 'critical';
  rules: SecurityRule[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityRule {
  id: string;
  name: string;
  condition: string;
  action: 'allow' | 'deny' | 'log' | 'alert';
  parameters: Record<string, any>;
}

// Core security policies
export const SECURITY_POLICIES: Record<string, SecurityPolicy> = {
  // Authentication policies
  'strong_password_policy': {
    id: 'strong_password_policy',
    name: 'Strong Password Policy',
    description: 'Enforce strong password requirements',
    category: 'authentication',
    severity: 'high',
    enabled: true,
    rules: [
      {
        id: 'min_length',
        name: 'Minimum Length',
        condition: 'password.length >= 8',
        action: 'deny',
        parameters: { minLength: 8 },
      },
      {
        id: 'complexity',
        name: 'Password Complexity',
        condition: 'hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars',
        action: 'deny',
        parameters: {},
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  'mfa_required': {
    id: 'mfa_required',
    name: 'Multi-Factor Authentication Required',
    description: 'Require MFA for all users',
    category: 'authentication',
    severity: 'critical',
    enabled: true,
    rules: [
      {
        id: 'mfa_enforcement',
        name: 'MFA Enforcement',
        condition: 'user.role === "admin" || user.permissions.includes("sensitive_data")',
        action: 'deny',
        parameters: { requiredMethods: ['sms', 'email', 'app'] },
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Authorization policies
  'role_based_access': {
    id: 'role_based_access',
    name: 'Role-Based Access Control',
    description: 'Enforce role-based permissions',
    category: 'authorization',
    severity: 'high',
    enabled: true,
    rules: [
      {
        id: 'permission_check',
        name: 'Permission Validation',
        condition: 'user.role && user.permissions.includes(requiredPermission)',
        action: 'deny',
        parameters: {},
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Data protection policies
  'data_encryption': {
    id: 'data_encryption',
    name: 'Data Encryption at Rest',
    description: 'Encrypt sensitive data at rest',
    category: 'data_protection',
    severity: 'critical',
    enabled: true,
    rules: [
      {
        id: 'encryption_required',
        name: 'Encryption Enforcement',
        condition: 'data.type === "sensitive" && !data.encrypted',
        action: 'deny',
        parameters: { algorithm: 'AES-256' },
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Network policies
  'rate_limiting': {
    id: 'rate_limiting',
    name: 'API Rate Limiting',
    description: 'Limit API requests per user/IP',
    category: 'network',
    severity: 'medium',
    enabled: true,
    rules: [
      {
        id: 'request_limit',
        name: 'Request Rate Limit',
        condition: 'requestsPerMinute > limit',
        action: 'deny',
        parameters: { maxRequests: 100, windowMinutes: 1 },
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Monitoring policies
  'security_monitoring': {
    id: 'security_monitoring',
    name: 'Security Event Monitoring',
    description: 'Monitor and alert on security events',
    category: 'monitoring',
    severity: 'high',
    enabled: true,
    rules: [
      {
        id: 'failed_login_monitoring',
        name: 'Failed Login Monitoring',
        condition: 'failedLoginAttempts > 5',
        action: 'alert',
        parameters: { alertType: 'security_breach' },
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

// Role-specific security policies
export const ROLE_SECURITY_POLICIES: Record<string, string[]> = {
  'admin': [
    'strong_password_policy',
    'mfa_required',
    'role_based_access',
    'data_encryption',
    'rate_limiting',
    'security_monitoring',
  ],
  'manager': [
    'strong_password_policy',
    'mfa_required',
    'role_based_access',
    'data_encryption',
    'rate_limiting',
  ],
  'user': [
    'strong_password_policy',
    'role_based_access',
    'rate_limiting',
  ],
  'guest': [
    'rate_limiting',
  ],
};

// Feature-specific security policies
export const FEATURE_SECURITY_POLICIES: Record<string, string[]> = {
  'billing': [
    'data_encryption',
    'mfa_required',
    'security_monitoring',
  ],
  'customer_data': [
    'data_encryption',
    'role_based_access',
    'security_monitoring',
  ],
  'admin_panel': [
    'mfa_required',
    'role_based_access',
    'security_monitoring',
  ],
  'api_access': [
    'rate_limiting',
    'role_based_access',
    'security_monitoring',
  ],
};

// Environment-specific security policies
export const ENVIRONMENT_SECURITY_POLICIES: Record<string, string[]> = {
  'production': [
    'strong_password_policy',
    'mfa_required',
    'role_based_access',
    'data_encryption',
    'rate_limiting',
    'security_monitoring',
  ],
  'staging': [
    'strong_password_policy',
    'role_based_access',
    'data_encryption',
    'rate_limiting',
  ],
  'development': [
    'role_based_access',
    'rate_limiting',
  ],
};

// Compliance frameworks
export const COMPLIANCE_FRAMEWORKS: Record<string, {
  name: string;
  description: string;
  policies: string[];
}> = {
  'gdpr': {
    name: 'General Data Protection Regulation',
    description: 'EU data protection and privacy regulation',
    policies: [
      'data_encryption',
      'role_based_access',
      'security_monitoring',
    ],
  },
  'ccpa': {
    name: 'California Consumer Privacy Act',
    description: 'California privacy protection regulation',
    policies: [
      'data_encryption',
      'role_based_access',
      'security_monitoring',
    ],
  },
  'sox': {
    name: 'Sarbanes-Oxley Act',
    description: 'Financial reporting and auditing standards',
    policies: [
      'strong_password_policy',
      'mfa_required',
      'role_based_access',
      'data_encryption',
      'security_monitoring',
    ],
  },
  'pci_dss': {
    name: 'Payment Card Industry Data Security Standard',
    description: 'Payment card data security requirements',
    policies: [
      'strong_password_policy',
      'mfa_required',
      'data_encryption',
      'security_monitoring',
      'rate_limiting',
    ],
  },
};

/**
 * Get security policy by ID
 */
export function getSecurityPolicy(policyId: string): SecurityPolicy | undefined {
  return SECURITY_POLICIES[policyId];
}

/**
 * Get security policies for a role
 */
export function getRoleSecurityPolicy(role: string): SecurityPolicy[] {
  const policyIds = ROLE_SECURITY_POLICIES[role] || [];
  return policyIds.map(id => SECURITY_POLICIES[id]).filter(Boolean);
}

/**
 * Validate security compliance
 */
export function validateSecurityCompliance(
  userRole: string,
  environment: string,
  features: string[],
  complianceFrameworks: string[] = []
): {
  compliant: boolean;
  violations: string[];
  recommendations: string[];
} {
  const violations: string[] = [];
  const recommendations: string[] = [];

  // Check role-based policies
  const rolePolicies = getRoleSecurityPolicy(userRole);
  
  // Check environment policies
  const envPolicyIds = ENVIRONMENT_SECURITY_POLICIES[environment] || [];
  const envPolicies = envPolicyIds.map(id => SECURITY_POLICIES[id]).filter(Boolean);
  
  // Check feature policies
  const featurePolicyIds = features.flatMap(feature => FEATURE_SECURITY_POLICIES[feature] || []);
  const featurePolicies = featurePolicyIds.map(id => SECURITY_POLICIES[id]).filter(Boolean);
  
  // Check compliance framework policies
  const compliancePolicyIds = complianceFrameworks.flatMap(framework => 
    COMPLIANCE_FRAMEWORKS[framework]?.policies || []
  );
  const compliancePolicies = compliancePolicyIds.map(id => SECURITY_POLICIES[id]).filter(Boolean);

  // Combine all required policies
  const allRequiredPolicies = [
    ...rolePolicies,
    ...envPolicies,
    ...featurePolicies,
    ...compliancePolicies,
  ];

  // Check for disabled policies
  const disabledPolicies = allRequiredPolicies.filter(policy => !policy.enabled);
  if (disabledPolicies.length > 0) {
    violations.push(`Disabled security policies: ${disabledPolicies.map(p => p.name).join(', ')}`);
  }

  // Check for missing critical policies
  const criticalPolicies = allRequiredPolicies.filter(policy => policy.severity === 'critical');
  const missingCritical = criticalPolicies.filter(policy => !policy.enabled);
  if (missingCritical.length > 0) {
    violations.push(`Missing critical security policies: ${missingCritical.map(p => p.name).join(', ')}`);
  }

  // Generate recommendations
  if (userRole === 'admin' && !rolePolicies.some(p => p.id === 'mfa_required')) {
    recommendations.push('Enable MFA for admin users');
  }

  if (environment === 'production' && !envPolicies.some(p => p.id === 'security_monitoring')) {
    recommendations.push('Enable security monitoring for production environment');
  }

  if (features.includes('billing') && !featurePolicies.some(p => p.id === 'data_encryption')) {
    recommendations.push('Enable data encryption for billing features');
  }

  return {
    compliant: violations.length === 0,
    violations,
    recommendations,
  };
}
