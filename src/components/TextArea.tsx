import React from 'react'

export interface TextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  minRows?: number; // defaults to 1
}

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
  return (
    <textarea
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


