/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Включаем поддержку тёмной темы через класс
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          border: "hsl(var(--border))", // используем существующую border переменную
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        
        // ESG semantic colors using CSS variables
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        
        // Dashboard specific colors
        'dashboard-bg': "hsl(var(--dashboard-bg))",
        'stats-card': "hsl(var(--stats-card))",
        'stats-card-border': "hsl(var(--stats-card-border))",
        'chart-bg': "hsl(var(--chart-bg))",
        'table-header': "hsl(var(--table-header))",
        'table-row-hover': "hsl(var(--table-row-hover))",
        
        // ESG-Lite цветовая схема 2025 
        'esg-primary': {
          50: '#f0fdf4',   // Очень светло-зеленый фон
          100: '#dcfce7',  // Светло-зеленый
          500: '#22c55e',  // Основной зеленый
          600: '#16a34a',  // Темно-зеленый (основной)
          700: '#15803d',  // Еще темнее
          900: '#14532d',  // Самый темный
        },
        'esg-blue': '#3b82f6',     // Доверие, технологии
        'esg-amber': '#f59e0b',    // Энергия, предупреждения
        'esg-success': '#10b981',  // Успех
        'esg-warning': '#f59e0b',  // Предупреждение
        'esg-error': '#ef4444',    // Ошибка
        'esg-info': '#3b82f6',     // Информация
      },
      
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Современные border radius значения Tailwind 4.x
        'none': '0',
        'DEFAULT': '0.375rem', // 6px
        'modern': '0.75rem',   // 12px
        'card': '1rem',        // 16px
        '2xl': '1.5rem',       // 24px
        '3xl': '2rem',         // 32px
        'full': '9999px',
      },
      
      fontFamily: {
        // Современная типографика
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      
      fontSize: {
        // Tailwind 4.x типографическая система
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        'display': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'h1': ['3rem', { lineHeight: '1.2' }],
        'h2': ['2.25rem', { lineHeight: '1.3' }],
        'h3': ['1.875rem', { lineHeight: '1.4' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body': ['1rem', { lineHeight: '1.5' }],
        'small': ['0.875rem', { lineHeight: '1.4' }],
      },
      
      backgroundImage: {
        'gradient-hero': 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #f0f9ff 100%)',
        'gradient-card': 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        'gradient-button': 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      
      // Современные тени для Tailwind 4.x
      boxShadow: {
        'soft': '0 2px 8px 0 rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 16px 0 rgba(0, 0, 0, 0.1)',
        'strong': '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
        'glow': '0 0 20px rgba(34, 197, 94, 0.3)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
        'inner-soft': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'modern': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'modern-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'button': '0 4px 14px 0 rgba(22, 163, 74, 0.2)',
        'button-hover': '0 6px 20px 0 rgba(22, 163, 74, 0.3)',
      },
      
      // Анимации Tailwind 4.x
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-in-out',
        'slideUp': 'slideUp 0.4s ease-out',
        'slideDown': 'slideDown 0.4s ease-out',
        'scaleIn': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-light': 'bounce 2s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-in-from-top': 'slide-in-from-top 0.3s ease-out',
        'hover-lift': 'hover-lift 0.3s ease-out',
        'pulse-loading': 'pulse-loading 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-from-top": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "hover-lift": {
          "0%": { transform: "translateY(0px)" },
          "100%": { transform: "translateY(-2px)" },
        },
        "pulse-loading": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      
      // Spacing система для современных интерфейсов
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      
      // Современные backdrop blur значения
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '12px',  
        'lg': '16px',
        'xl': '24px',
        '2xl': '40px',
        '3xl': '64px',
      },
      
      // Container queries поддержка
      container: {
        center: true,
        padding: "2rem",
        screens: {
          "2xl": "1400px",
        },
      },
    },
  },
  
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/container-queries'),
    
    // Кастомные утилиты для ESG-Lite
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Современные градиентные фоны
        '.bg-gradient-esg': {
          background: 'linear-gradient(135deg, #22c55e 0%, #3b82f6 100%)',
        },
        '.bg-gradient-esg-subtle': {
          background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
        },
        
        // Утилиты для скрытия скроллбара
        '.hide-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        
        // Утилиты для стеклянного эффекта
        '.glass': {
          'backdrop-filter': 'blur(12px)',
          'background-color': 'rgba(255, 255, 255, 0.1)',
          'border': '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glass-dark': {
          'backdrop-filter': 'blur(12px)',
          'background-color': 'rgba(0, 0, 0, 0.1)',
          'border': '1px solid rgba(255, 255, 255, 0.1)',
        },
        
        // Утилиты для safe area
        '.safe-top': {
          'padding-top': 'env(safe-area-inset-top)',
        },
        '.safe-bottom': {
          'padding-bottom': 'env(safe-area-inset-bottom)',
        },
        '.safe-left': {
          'padding-left': 'env(safe-area-inset-left)',
        },
        '.safe-right': {
          'padding-right': 'env(safe-area-inset-right)',
        },
        
        // Современные текстовые утилиты
        '.text-gradient': {
          'background': 'linear-gradient(135deg, #22c55e 0%, #3b82f6 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        
        // Утилиты для интерактивности
        '.interactive': {
          'transition': 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            'transform': 'translateY(-1px)',
            'box-shadow': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        },
      }
      
      addUtilities(newUtilities)
    },
  ],
}