interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function Input({
  error = false,
  className = '',
  'aria-invalid': ariaInvalid,
  ...rest
}: InputProps) {
  return (
    <input
      aria-invalid={ariaInvalid ?? error}
      className={`ui-input ${error ? 'ui-input-error' : ''} ${className}`}
      {...rest}
    />
  )
}
