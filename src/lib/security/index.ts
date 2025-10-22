// Export security services
export { SecurityService } from './securityService';
export { AdvancedSecurityService } from './advancedSecurityService';

// Create service instances for easy import
import { SecurityService } from './securityService';
import { AdvancedSecurityService } from './advancedSecurityService';

// Default instances
export const securityService = new SecurityService();
export const advancedSecurityService = new AdvancedSecurityService();
