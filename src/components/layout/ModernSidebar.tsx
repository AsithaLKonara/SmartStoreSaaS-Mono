'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { navigationConfig, filterNavigationByRole, NavigationItem } from '@/app/(dashboard)/navigation-config';

interface ModernSidebarProps {
  userRole: string;
  onClose?: () => void;
}

export function ModernSidebar({ userRole, onClose }: ModernSidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const filteredNav = filterNavigationByRole(navigationConfig, userRole);

  const toggleExpand = (label: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(label)) {
      newExpanded.delete(label);
    } else {
      newExpanded.add(label);
    }
    setExpandedItems(newExpanded);
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const renderNavItem = (item: NavigationItem, depth = 0) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.label);
    const active = isActive(item.href);

    if (hasChildren) {
      return (
        <div key={item.label} className="mb-1">
          <button
            onClick={() => toggleExpand(item.label)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200
              ${active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}
              ${depth > 0 ? 'pl-8' : ''}
            `}
          >
            <div className="flex items-center space-x-3">
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{item.label}</span>
              {item.badge && (
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium
                  ${item.badgeColor === 'purple' ? 'bg-purple-500/20 text-purple-300' : ''}
                  ${item.badgeColor === 'green' ? 'bg-green-500/20 text-green-300' : ''}
                  ${item.badgeColor === 'orange' ? 'bg-orange-500/20 text-orange-300' : ''}
                  ${item.badgeColor === 'blue' ? 'bg-blue-500/20 text-blue-300' : ''}
                  ${item.badgeColor === 'yellow' ? 'bg-yellow-500/20 text-yellow-300' : ''}
                `}>
                  {item.badge}
                </span>
              )}
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          
          {isExpanded && (
            <div className="mt-1 space-y-1">
              {item.children!.map(child => renderNavItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href!}
        onClick={onClose}
        className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 mb-1
          ${active 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }
          ${depth > 0 ? 'pl-8' : ''}
        `}
      >
        <div className="flex items-center space-x-3">
          <Icon className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{item.label}</span>
          {item.badge && (
            <span className={`px-2 py-0.5 text-xs rounded-full font-medium
              ${item.badgeColor === 'purple' ? 'bg-purple-500/20 text-purple-300' : ''}
              ${item.badgeColor === 'green' ? 'bg-green-500/20 text-green-300' : ''}
              ${item.badgeColor === 'orange' ? 'bg-orange-500/20 text-orange-300' : ''}
              ${item.badgeColor === 'blue' ? 'bg-blue-500/20 text-blue-300' : ''}
              ${item.badgeColor === 'yellow' ? 'bg-yellow-500/20 text-yellow-300' : ''}
            `}>
              {item.badge}
            </span>
          )}
        </div>
      </Link>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <Link href="/dashboard" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">SmartStore</h2>
            <p className="text-xs text-gray-400">SaaS Platform</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {filteredNav.map(item => renderNavItem(item))}
      </nav>

      {/* Search */}
      <div className="p-4 border-t border-gray-700">
        <div className="relative">
          <input
            type="text"
            placeholder="Search... (Ctrl+K)"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

