import { forwardRef, ButtonHTMLAttributes } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-600 active:bg-primary-700 shadow-glow-blue hover:shadow-glow-blue-strong',
  secondary:
    'bg-surface-secondary border border-border text-text-primary hover:bg-surface-hover hover:border-border-bright',
  danger:
    'bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20 hover:border-danger/50',
  ghost:
    'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
  icon:
    'text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg',
}

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-6 px-2 text-xs gap-1',
  sm: 'h-7 px-2.5 text-xs gap-1.5',
  md: 'h-8 px-3.5 text-sm gap-2',
  lg: 'h-10 px-5 text-base gap-2',
}

const iconSizeStyles: Record<ButtonSize, string> = {
  xs: 'h-6 w-6 p-1',
  sm: 'h-7 w-7 p-1.5',
  md: 'h-8 w-8 p-1.5',
  lg: 'h-10 w-10 p-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const isIcon = variant === 'icon'
    const isDisabled = disabled || loading

    return (
      <motion.button
        ref={ref}
        whileHover={isDisabled ? {} : { scale: 1.02 }}
        whileTap={isDisabled ? {} : { scale: 0.97 }}
        transition={{ duration: 0.1 }}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 select-none',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          isIcon ? iconSizeStyles[size] : sizeStyles[size],
          variantStyles[variant],
          className
        )}
        disabled={isDisabled}
        {...(props as HTMLMotionProps<'button'>)}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={14} />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className="shrink-0">{icon}</span>
            )}
            {children && <span>{children}</span>}
            {icon && iconPosition === 'right' && (
              <span className="shrink-0">{icon}</span>
            )}
          </>
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
