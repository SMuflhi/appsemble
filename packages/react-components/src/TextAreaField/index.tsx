import classNames from 'classnames';
import React, { ComponentPropsWithoutRef, forwardRef } from 'react';

import { FormComponent, SharedFormComponentProps, TextArea } from '..';

type TextAreaFieldProps = SharedFormComponentProps &
  Omit<ComponentPropsWithoutRef<typeof TextArea>, keyof SharedFormComponentProps>;

/**
 * A Bulma styled textarea element.
 */
export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  (
    {
      addon,
      className,
      control,
      error,
      help,
      icon,
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
      <TextArea
        {...props}
        className={classNames('textarea', { 'is-danger': error })}
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
