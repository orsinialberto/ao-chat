import React, { useRef, useEffect } from 'react'

export interface TextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  minRows?: number; // defaults to 1
}

const MAX_HEIGHT_PX = 200
const SINGLE_LINE_HEIGHT_PX = 55

export const TextArea: React.FC<TextAreaProps> = ({
  id,
  value,
  onChange,
  placeholder,
  ariaLabel,
  ariaLabelledBy,
  minRows = 1,
  disabled,
  className,
  ...rest
}) => {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    const h = Math.min(el.scrollHeight, MAX_HEIGHT_PX)
    el.style.height = `${h}px`
    el.style.overflowY = h >= MAX_HEIGHT_PX ? 'auto' : 'hidden'
    el.dataset.expanded = h > SINGLE_LINE_HEIGHT_PX ? 'true' : 'false'
  }, [value])

  return (
    <textarea
      ref={ref}
      id={id}
      className={`aic-textarea ${className ?? ''}`.trim()}
      placeholder={placeholder}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={minRows}
      disabled={disabled}
      {...rest}
    />
  )
}

export default TextArea


