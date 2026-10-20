import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { classNames } from '../../utils/format';

export interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required = false,
  children,
  className,
}: FieldProps) {
  return (
    <div className={classNames('field', className)}>
      <label className="field__label" htmlFor={htmlFor}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {error ? (
        <span className="field__error" role="alert">
          {error}
        </span>
      ) : null}
      {!error && hint ? <span className="field__hint">{hint}</span> : null}
    </div>
  );
}

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function TextInput({ label, error, hint, id, className, required, ...rest }: TextInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Field label={label} htmlFor={inputId} error={error} hint={hint} required={required}>
      <input
        id={inputId}
        className={classNames('input', className)}
        aria-invalid={error ? true : undefined}
        required={required}
        {...rest}
      />
    </Field>
  );
}

export interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function SelectInput({
  label,
  error,
  hint,
  id,
  className,
  options,
  placeholder,
  required,
  ...rest
}: SelectInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Field label={label} htmlFor={inputId} error={error} hint={hint} required={required}>
      <select
        id={inputId}
        className={classNames('select', className)}
        aria-invalid={error ? true : undefined}
        required={required}
        {...rest}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function TextArea({ label, error, hint, id, className, required, ...rest }: TextAreaProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Field label={label} htmlFor={inputId} error={error} hint={hint} required={required}>
      <textarea
        id={inputId}
        className={classNames('textarea', className)}
        aria-invalid={error ? true : undefined}
        required={required}
        {...rest}
      />
    </Field>
  );
}
