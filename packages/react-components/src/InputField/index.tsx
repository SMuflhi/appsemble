import { ComponentPropsWithoutRef, forwardRef } from 'react';

import { FormComponent, Input, SharedFormComponentProps } from '..';

type InputFieldProps = Omit<
  ComponentPropsWithoutRef<typeof Input>,
  keyof SharedFormComponentProps
> &
  SharedFormComponentProps;

/**
 * A Bulma styled form input element.
 */
export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      addon,
      className,
      control,
      error,
      icon,
      help,
      label,
      maxLength,
      name,
      required,
      value,
      id = name,
      ...props
    },
    ref,
  ) => (
    <FormComponent
      addon={addon}
      className={className}
      control={control}
      error={error}
      help={help}
      helpExtra={maxLength ? `${value == null ? 0 : String(value).length} / ${maxLength}` : null}
      icon={icon}
      id={id}
      label={label}
      required={required}
    >
      <Input
        {...props}
        error={Boolean(error)}
        id={id}
        maxLength={maxLength}
        name={name}
        ref={ref}
        required={required}
        value={value}
      />
    </FormComponent>
  ),
);
