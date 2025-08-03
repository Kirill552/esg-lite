import { 
  InputHTMLAttributes, 
  SelectHTMLAttributes, 
  forwardRef, 
  useState, 
  useEffect, 
  useRef,
  ReactNode
} from 'react'
import { Search, X, Filter, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AccessibleIcon } from '@/components/ui/AccessibleIcon'
import { Input } from '@/components/ui/Input'

// Поисковый компонент
interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  onSearch?: (query: string) => void
  onClear?: () => void
  debounceMs?: number
  showClearButton?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ 
    className, 
    onSearch, 
    onClear, 
    debounceMs = 300,
    showClearButton = true,
    size = 'md',
    placeholder = 'Поиск...',
    value,
    onChange,
    ...props 
  }, ref) => {
    const [searchValue, setSearchValue] = useState(value || '')
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
      if (value !== undefined) {
        setSearchValue(value)
      }
    }, [value])

    useEffect(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        onSearch?.(searchValue as string)
      }, debounceMs)

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }, [searchValue, onSearch, debounceMs])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setSearchValue(newValue)
      onChange?.(e)
    }

    const handleClear = () => {
      setSearchValue('')
      onClear?.()
      if (onChange) {
        const syntheticEvent = {
          target: { value: '' },
          currentTarget: { value: '' }
        } as React.ChangeEvent<HTMLInputElement>
        onChange(syntheticEvent)
      }
    }

    return (
      <Input
        ref={ref}
        type="search"
        value={searchValue}
        onChange={handleChange}
        placeholder={placeholder}
        size={size}
        leftIcon={<AccessibleIcon icon={Search} decorative />}
        rightIcon={
          showClearButton && searchValue ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Очистить поиск"
            >
              <AccessibleIcon icon={X} className="w-4 h-4" label="Очистить" />
            </button>
          ) : undefined
        }
        className={className}
        {...props}
      />
    )
  }
)

SearchInput.displayName = 'SearchInput'

// Компонент фильтра
interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: FilterOption[]
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  showCounts?: boolean
}

const FilterSelect = forwardRef<HTMLSelectElement, FilterSelectProps>(
  ({ 
    className, 
    options, 
    placeholder = 'Все категории',
    size = 'md',
    showCounts = false,
    ...props 
  }, ref) => {
    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3',
      lg: 'px-5 py-4 text-lg',
    }

    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'block w-full appearance-none bg-background border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 pr-10',
            'dark:[&>option]:bg-background dark:[&>option]:text-foreground',
            '[&>option]:bg-background [&>option]:text-foreground',
            sizes[size],
            className
          )}
          {...props}
        >
          <option value="" className="bg-background text-foreground">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-background text-foreground">
              {option.label}
              {showCounts && option.count !== undefined && ` (${option.count})`}
            </option>
          ))}
        </select>
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <AccessibleIcon
            icon={ChevronDown}
            className="w-5 h-5 text-muted-foreground"
            decorative
          />
        </div>
      </div>
    )
  }
)

FilterSelect.displayName = 'FilterSelect'

// Комбинированный компонент поиска и фильтрации
interface SearchAndFilterProps {
  searchProps?: Omit<SearchInputProps, 'ref'>
  filterProps?: Omit<FilterSelectProps, 'ref'>
  children?: ReactNode
  className?: string
  layout?: 'horizontal' | 'vertical'
  gap?: 'sm' | 'md' | 'lg'
}

const SearchAndFilter = forwardRef<HTMLDivElement, SearchAndFilterProps>(
  ({ 
    searchProps, 
    filterProps, 
    children,
    className,
    layout = 'horizontal',
    gap = 'md',
    ...props 
  }, ref) => {
    const gaps = {
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
    }

    const layouts = {
      horizontal: 'flex flex-col sm:flex-row sm:items-end',
      vertical: 'flex flex-col',
    }

    return (
      <div
        ref={ref}
        className={cn(
          layouts[layout],
          gaps[gap],
          className
        )}
        {...props}
      >
        {searchProps && (
          <div className="flex-1 min-w-0">
            <SearchInput {...searchProps} />
          </div>
        )}
        
        {filterProps && (
          <div className="flex-shrink-0 min-w-[200px]">
            <FilterSelect {...filterProps} />
          </div>
        )}
        
        {children && (
          <div className="flex-shrink-0">
            {children}
          </div>
        )}
      </div>
    )
  }
)

SearchAndFilter.displayName = 'SearchAndFilter'

// Компонент активных фильтров
interface ActiveFilter {
  id: string
  label: string
  value: string
  removable?: boolean
}

interface ActiveFiltersProps {
  filters: ActiveFilter[]
  onRemove?: (filterId: string) => void
  onClearAll?: () => void
  className?: string
}

const ActiveFilters = forwardRef<HTMLDivElement, ActiveFiltersProps>(
  ({ filters, onRemove, onClearAll, className, ...props }, ref) => {
    if (filters.length === 0) return null

    return (
      <div
        ref={ref}
        className={cn('flex flex-wrap items-center gap-2', className)}
        {...props}
      >
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Активные фильтры:
        </span>
        
        {filters.map((filter) => (
          <span
            key={filter.id}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200"
          >
            <span className="font-medium mr-1">{filter.label}:</span>
            <span>{filter.value}</span>
            {filter.removable !== false && onRemove && (
              <button
                type="button"
                onClick={() => onRemove(filter.id)}
                className="ml-1 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200 transition-colors"
                aria-label={`Удалить фильтр ${filter.label}: ${filter.value}`}
              >
                <AccessibleIcon icon={X} className="w-3 h-3" label="Удалить фильтр" />
              </button>
            )}
          </span>
        ))}
        
        {filters.length > 1 && onClearAll && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline transition-colors"
          >
            Очистить все
          </button>
        )}
      </div>
    )
  }
)

ActiveFilters.displayName = 'ActiveFilters'

export { SearchInput, FilterSelect, SearchAndFilter, ActiveFilters }
export type { FilterOption, ActiveFilter }
