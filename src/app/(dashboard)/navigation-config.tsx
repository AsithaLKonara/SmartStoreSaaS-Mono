import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Calculator,
  TrendingUp,
  Warehouse,
  Truck,
  Building2,
  CreditCard,
  FileText,
  Archive,
  Plug,
  MessageSquare,
  Store,
  ShoppingBag,
  Mail,
  MessageCircle,
  DollarSign,
  Settings as Cog,
  Rocket,
  Target,
  Trophy,
  Star,
  FileSearch,
  FolderTree,
  Webhook,
  FileCode,
  TestTube,
  CheckSquare,
  Book,
  Boxes,
  PackageCheck,
  RotateCcw,
  BookOpen,
  Shield,
  UserCog,
  Layers,
  Zap,
  Brain,
  Sparkles,
  PieChart,
  Settings
} from 'lucide-react';

export interface NavigationItem {
  label: string;
  href?: string;
  icon: any;
  roles?: string[]; // Which roles can see this
  children?: NavigationItem[];
  badge?: string;
  badgeColor?: string;
}

export const navigationConfig: NavigationItem[] = [
  // MAIN
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF', 'CUSTOMER']
  },

  // CORE OPERATIONS
  {
    label: 'Products',
    href: '/products',
    icon: Package,
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF']
  },
  {
    label: 'Orders',
    href: '/orders',
    icon: ShoppingCart,
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF']
  },
  {
    label: 'Customers',
    href: '/customers',
    icon: Users,
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF']
  },

  // OPERATIONS
  {
    label: 'Operations',
    icon: Boxes,
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN'],
    children: [
      {
        label: 'Inventory',
        href: '/inventory',
        icon: Warehouse
      },
      {
        label: 'Warehouse',
        href: '/warehouse',
        icon: Building2
      },
      {
        label: 'POS',
        href: '/pos',
        icon: Store
      },
      {
        label: 'Fulfillment',
        href: '/fulfillment',
        icon: PackageCheck,
        badge: 'New',
        badgeColor: 'green'
      },
      {
        label: 'Returns',
        href: '/returns',
        icon: RotateCcw,
        badge: 'New',
        badgeColor: 'blue'
      },
      {
        label: 'Shipping',
        href: '/shipping',
        icon: Truck
      },
      {
        label: 'Couriers',
        href: '/couriers',
        icon: Truck
      }
    ]
  },

  // INTEGRATIONS
  {
    label: 'Integrations',
    icon: Plug,
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN'],
    badge: '7',
    badgeColor: 'purple',
    children: [
      {
        label: 'Integration Hub',
        href: '/integrations',
        icon: Layers
      },
      {
        label: 'WhatsApp',
        href: '/integrations/whatsapp',
        icon: MessageCircle,
        badge: '✓',
        badgeColor: 'green'
      },
      {
        label: 'WooCommerce',
        href: '/integrations/woocommerce',
        icon: ShoppingBag,
        badge: 'Setup',
        badgeColor: 'orange'
      },
      {
        label: 'Shopify',
        href: '/integrations/shopify',
        icon: Store,
        badge: 'Setup',
        badgeColor: 'orange'
      },
      {
        label: 'Stripe',
        href: '/integrations/stripe',
        icon: CreditCard,
        badge: 'Setup',
        badgeColor: 'orange'
      },
      {
        label: 'PayHere',
        href: '/integrations/payhere',
        icon: DollarSign,
        badge: 'Setup',
        badgeColor: 'orange'
      },
      {
        label: 'Email',
        href: '/integrations/email',
        icon: Mail,
        badge: 'Setup',
        badgeColor: 'orange'
      },
      {
        label: 'SMS',
        href: '/integrations/sms',
        icon: MessageSquare,
        badge: 'Setup',
        badgeColor: 'orange'
      }
    ]
  },

  // FINANCIAL
  {
    label: 'Financial',
    icon: Calculator,
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN'],
    children: [
      {
        label: 'Accounting',
        href: '/accounting',
        icon: Calculator
      },
      {
        label: 'Payments',
        href: '/payments',
        icon: CreditCard
      },
      {
        label: 'Expenses',
        href: '/expenses',
        icon: DollarSign,
        badge: 'New',
        badgeColor: 'green'
      },
      {
        label: 'Billing',
        href: '/billing',
        icon: FileText
      },
      {
        label: 'Procurement',
        href: '/procurement',
        icon: ShoppingCart
      }
    ]
  },

  // ANALYTICS & AI
  {
    label: 'Analytics & AI',
    icon: Brain,
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN'],
    children: [
      {
        label: 'Analytics',
        href: '/analytics',
        icon: TrendingUp
      },
      {
        label: 'Enhanced Analytics',
        href: '/analytics/enhanced',
        icon: PieChart
      },
      {
        label: 'AI Analytics',
        href: '/ai-analytics',
        icon: Brain,
        badge: 'AI',
        badgeColor: 'purple'
      },
      {
        label: 'AI Insights',
        href: '/ai-insights',
        icon: Sparkles,
        badge: 'AI',
        badgeColor: 'purple'
      },
      {
        label: 'Customer Insights',
        href: '/analytics/customer-insights',
        icon: Users
      },
      {
        label: 'Reports',
        href: '/reports',
        icon: FileText
      }
    ]
  },

  // MARKETING & ENGAGEMENT
  {
    label: 'Marketing',
    icon: Target,
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN'],
    children: [
      {
        label: 'Campaigns',
        href: '/campaigns',
        icon: Rocket
      },
      {
        label: 'Loyalty Program',
        href: '/loyalty',
        icon: Trophy
      },
      {
        label: 'Reviews',
        href: '/reviews',
        icon: Star,
        badge: 'New',
        badgeColor: 'yellow'
      },
      {
        label: 'Affiliates',
        href: '/affiliates',
        icon: Users,
        badge: 'New',
        badgeColor: 'green'
      }
    ]
  },

  // CUSTOMER SUPPORT
  {
    label: 'Support',
    icon: MessageSquare,
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'],
    children: [
      {
        label: 'Chat',
        href: '/chat',
        icon: MessageCircle,
        badge: 'Live',
        badgeColor: 'green'
      },
      {
        label: 'Customer Portal',
        href: '/customer-portal',
        icon: Users
      }
    ]
  },

  // SYSTEM & ADMIN
  {
    label: 'System',
    icon: Cog,
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN'],
    children: [
      {
        label: 'Settings',
        href: '/settings',
        icon: Settings
      },
      {
        label: 'Users',
        href: '/users',
        icon: UserCog
      },
      {
        label: 'Subscriptions',
        href: '/subscriptions',
        icon: CreditCard
      },
      {
        label: 'Configuration',
        href: '/configuration',
        icon: FolderTree
      },
      {
        label: 'Webhooks',
        href: '/webhooks',
        icon: Webhook
      },
      {
        label: 'Bulk Operations',
        href: '/bulk-operations',
        icon: Zap
      },
      {
        label: 'Sync',
        href: '/sync',
        icon: RotateCcw
      }
    ]
  },

  // SUPER ADMIN
  {
    label: 'Administration',
    icon: Shield,
    roles: ['SUPER_ADMIN'],
    children: [
      {
        label: 'Organizations',
        href: '/tenants',
        icon: Building2
      },
      {
        label: 'Admin Billing',
        href: '/admin/billing',
        icon: CreditCard
      },
      {
        label: 'Packages',
        href: '/admin/packages',
        icon: Package
      },
      {
        label: 'Audit Logs',
        href: '/audit',
        icon: FileSearch
      },
      {
        label: 'Compliance',
        href: '/compliance',
        icon: Shield
      },
      {
        label: 'Backup & Recovery',
        href: '/backup',
        icon: Archive
      },
      {
        label: 'Monitoring',
        href: '/monitoring',
        icon: TrendingUp
      },
      {
        label: 'Performance',
        href: '/performance',
        icon: Zap
      },
      {
        label: 'Logs',
        href: '/logs',
        icon: FileText
      }
    ]
  },

  // DEVELOPER
  {
    label: 'Developer',
    icon: FileCode,
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN'],
    children: [
      {
        label: 'API Documentation',
        href: '/docs',
        icon: Book
      },
      {
        label: 'Documentation',
        href: '/documentation',
        icon: BookOpen
      },
      {
        label: 'Testing',
        href: '/testing',
        icon: TestTube
      },
      {
        label: 'Validation',
        href: '/validation',
        icon: CheckSquare
      },
      {
        label: 'Deployment',
        href: '/deployment',
        icon: Rocket
      }
    ]
  }
];

export function filterNavigationByRole(navigation: NavigationItem[], userRole: string): NavigationItem[] {
  return navigation
    .filter(item => !item.roles || item.roles.includes(userRole))
    .map(item => ({
      ...item,
      children: item.children
        ? filterNavigationByRole(item.children, userRole)
        : undefined
    }));
}

