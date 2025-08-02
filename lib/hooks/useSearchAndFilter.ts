import { useState, useCallback, useMemo } from 'react';
import { useDebounce } from './useDebounce';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T extends string> {
  field: T;
  direction: SortDirection;
}

export interface FilterConfig {
  [key: string]: any;
}

export interface UseSearchAndFilterOptions<T, K extends string> {
  data: T[];
  searchFields?: (keyof T)[];
  sortableFields?: K[];
  defaultSort?: SortConfig<K>;
  searchDebounceMs?: number;
}

export interface UseSearchAndFilterResult<T, K extends string> {
  // Состояние поиска
  searchTerm: string;
  debouncedSearchTerm: string;
  setSearchTerm: (term: string) => void;
  
  // Состояние фильтров
  filters: FilterConfig;
  setFilter: (key: string, value: any) => void;
  clearFilter: (key: string) => void;
  clearAllFilters: () => void;
  
  // Состояние сортировки
  sortConfig: SortConfig<K>;
  handleSort: (field: K) => void;
  
  // Результаты
  filteredData: T[];
  isLoading: boolean;
}

/**
 * Универсальный хук для поиска, фильтрации и сортировки данных
 */
export function useSearchAndFilter<T, K extends string>({
  data,
  searchFields = [],
  sortableFields = [],
  defaultSort,
  searchDebounceMs = 300,
}: UseSearchAndFilterOptions<T, K>): UseSearchAndFilterResult<T, K> {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterConfig>({});
  const [sortConfig, setSortConfig] = useState<SortConfig<K>>(
    defaultSort || { field: sortableFields[0], direction: 'desc' }
  );

  const debouncedSearchTerm = useDebounce(searchTerm, searchDebounceMs);

  const setFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilter = useCallback((key: string) => {
    setFilters(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
  }, []);

  const handleSort = useCallback((field: K) => {
    setSortConfig(prev => {
      if (prev.field === field) {
        return { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { field, direction: 'desc' };
    });
  }, []);

  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Применяем поиск
    if (debouncedSearchTerm && searchFields.length > 0) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchLower);
          }
          return false;
        })
      );
    }

    // Применяем фильтры
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        filtered = filtered.filter(item => {
          const itemValue = (item as any)[key];
          if (Array.isArray(value)) {
            return value.includes(itemValue);
          }
          return itemValue === value;
        });
      }
    });

    // Применяем сортировку
    if (sortConfig.field) {
      filtered.sort((a, b) => {
        const aVal = (a as any)[sortConfig.field];
        const bVal = (b as any)[sortConfig.field];

        let comparison = 0;
        
        if (aVal === null || aVal === undefined) comparison = 1;
        else if (bVal === null || bVal === undefined) comparison = -1;
        else if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.toLowerCase().localeCompare(bVal.toLowerCase());
        } else if (aVal instanceof Date && bVal instanceof Date) {
          comparison = aVal.getTime() - bVal.getTime();
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data, debouncedSearchTerm, searchFields, filters, sortConfig]);

  return {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
    filters,
    setFilter,
    clearFilter,
    clearAllFilters,
    sortConfig,
    handleSort,
    filteredData,
    isLoading: false, // можно добавить логику загрузки позже
  };
}
