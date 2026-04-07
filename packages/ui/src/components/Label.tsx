interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ className = '', children, ...rest }: LabelProps) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: htmlFor is passed via ...rest
    <label className={`ui-label ${className}`} {...rest}>
      {children}
    </label>
  )
}
