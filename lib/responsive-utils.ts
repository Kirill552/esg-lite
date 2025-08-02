/**
 * Утилиты для адаптивности ESG-Lite 2025
 * Основанные на современных практиках mobile-first дизайна
 */

export const breakpoints = {
  xs: '320px',  // Минимальные мобильные
  sm: '480px',  // Большие мобильные
  md: '768px',  // Планшеты
  lg: '1024px', // Десктопы
  xl: '1280px', // Большие десктопы
  '2xl': '1536px' // Очень большие экраны
} as const;

/**
 * Классы Tailwind для адаптивных сеток
 */
export const responsiveGridClasses = {
  // Карточки статистики
  statsGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6',
  
  // Основные действия
  actionsGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6',
  
  // Макет с боковой панелью
  sidebarLayout: 'grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8',
  sidebarMain: 'lg:col-span-2',
  sidebarAside: 'lg:col-span-1',
  
  // Таблицы
  tableContainer: 'overflow-x-auto -mx-4 sm:mx-0 sm:rounded-lg',
  tableWrapper: 'min-w-full inline-block align-middle',
} as const;

/**
 * Классы для контейнеров
 */
export const containerClasses = {
  page: 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20',
  main: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8',
  section: 'mb-6 lg:mb-8',
  card: 'p-4 sm:p-6 border-0 bg-white/60 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-lg transition-shadow',
} as const;

/**
 * Адаптивные размеры текста
 */
export const textSizes = {
  heading1: 'text-2xl sm:text-3xl lg:text-4xl font-bold',
  heading2: 'text-xl sm:text-2xl lg:text-3xl font-bold',
  heading3: 'text-lg sm:text-xl font-semibold',
  body: 'text-sm sm:text-base',
  caption: 'text-xs sm:text-sm',
} as const;

/**
 * Адаптивные отступы
 */
export const spacing = {
  section: 'mb-6 lg:mb-8',
  card: 'p-4 sm:p-6',
  cardSmall: 'p-3 sm:p-4',
  button: 'px-3 py-2 sm:px-4 sm:py-2',
  icon: 'w-4 h-4 sm:w-5 sm:h-5',
  iconLarge: 'w-6 h-6 sm:w-8 sm:h-8',
} as const;

/**
 * Адаптивные компоненты форм
 */
export const formClasses = {
  input: 'w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm sm:text-base',
  searchInput: 'w-full max-w-sm px-4 py-2 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm',
  button: 'inline-flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  buttonPrimary: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500',
  buttonSecondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
  buttonGhost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
} as const;

/**
 * Проверка мобильного устройства
 */
export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

/**
 * Хук для определения размера экрана
 */
export const useScreenSize = () => {
  if (typeof window === 'undefined') {
    return { isMobile: false, isTablet: false, isDesktop: true };
  }

  const width = window.innerWidth;
  
  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    width
  };
};

/**
 * Утилита для обрезки длинного текста
 */
export const truncateText = (text: string, maxLength: number = 50) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Адаптивные классы для навигации
 */
export const navigationClasses = {
  header: 'sticky top-0 z-40 bg-white/70 dark:bg-gray-900/70 backdrop-blur border-b border-gray-200 dark:border-gray-700',
  headerContainer: 'mx-auto flex h-14 sm:h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8',
  logo: 'text-lg sm:text-xl font-semibold text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors',
  nav: 'ml-6 lg:ml-8 hidden lg:flex space-x-3 lg:space-x-5 text-sm font-medium text-gray-700 dark:text-gray-300',
  mobileMenu: 'lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg',
  mobileMenuContent: 'px-4 py-3 space-y-2',
} as const;

/**
 * Адаптивные стили для таблиц
 */
export const tableClasses = {
  responsive: 'overflow-x-auto -mx-4 sm:mx-0',
  container: 'min-w-full divide-y divide-gray-200 dark:divide-gray-700',
  header: 'bg-gray-50 dark:bg-gray-800',
  headerCell: 'px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
  row: 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800',
  cell: 'px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100',
  // Скрываем колонки на мобильных
  hiddenOnMobile: 'hidden sm:table-cell',
  hiddenOnTablet: 'hidden lg:table-cell',
} as const;

/**
 * Медиа-запросы для CSS-in-JS решений
 */
export const mediaQueries = {
  mobile: `@media (max-width: ${breakpoints.md})`,
  tablet: `@media (min-width: ${breakpoints.md}) and (max-width: ${breakpoints.lg})`,
  desktop: `@media (min-width: ${breakpoints.lg})`,
} as const;
