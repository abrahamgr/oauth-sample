import {
  Children,
  cloneElement,
  isValidElement,
  type ReactNode,
  useId,
} from 'react'
import { Label } from './Label'

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  description?: string
  children: ReactNode
}

function appendDescribedBy(
  currentValue: unknown,
  nextIds: string[],
): string | undefined {
  const tokens = [
    ...(typeof currentValue === 'string' ? currentValue.split(/\s+/) : []),
    ...nextIds,
  ].filter(Boolean)

  return tokens.length > 0 ? Array.from(new Set(tokens)).join(' ') : undefined
}

export function FormField({
  label,
  htmlFor,
  error,
  description,
  children,
}: FormFieldProps) {
  const fieldId = useId()
  const descriptionId = description ? `${fieldId}-description` : undefined
  const errorId = error ? `${fieldId}-error` : undefined
  const describedBy = [descriptionId, errorId].filter(Boolean) as string[]
  const content = Children.map(children, (child) => {
    if (!isValidElement<{ id?: string; 'aria-describedby'?: string }>(child)) {
      return child
    }

    if (child.props.id !== htmlFor) {
      return child
    }

    return cloneElement(child, {
      'aria-describedby': appendDescribedBy(
        child.props['aria-describedby'],
        describedBy,
      ),
    })
  })

  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="mt-1">{content}</div>
      {description ? (
        <p id={descriptionId} className="ui-field-description">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="ui-error-message">
          {error}
        </p>
      ) : null}
    </div>
  )
}
