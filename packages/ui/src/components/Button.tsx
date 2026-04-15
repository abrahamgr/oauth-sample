type ButtonVariant = 'primary' | 'secondary' | 'danger'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'app-button-primary',
  secondary: 'app-button-secondary',
  danger: 'app-button-danger',
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`app-button ${variantClass[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
