'use client'

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav 
      className={`flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 ${className}`}
      aria-label="Хлебные крошки"
    >
      {/* Главная */}
      <Link 
        href="/dashboard" 
        className="flex items-center hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        aria-label="На главную"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {items.length > 0 && (
        <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
      )}
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.href && !item.current ? (
            <Link 
              href={item.href}
              className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span 
              className={item.current ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}
            >
              {item.label}
            </span>
          )}
          
          {index < items.length - 1 && (
            <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export default Breadcrumb;
