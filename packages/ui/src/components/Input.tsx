interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function Input({ error = false, className = '', ...rest }: InputProps) {
  return (
    <input
      className={`ui-input ${error ? 'ui-input-error' : ''} ${className}`}
      {...rest}
    />
  )
}
