import classNames from 'classnames';
import React, { ChangeEvent, ComponentPropsWithoutRef, forwardRef, useCallback } from 'react';

export interface TextAreaProps
  extends Omit<ComponentPropsWithoutRef<'textarea'>, 'label' | 'onChange'> {
  /**
   * Whether to render the input in an error state.
   */
  error?: boolean;

  /**
   * Indicate the select box is in a loading state.
   */
  loading?: boolean;

  /**
   * This is fired when the input value has changed.
   *
   * If the input type is `checkbox`, the value is a boolean. If the input type is `number`, the
   * value is a number, otherwise it is a string.
   */
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>, value: string) => void;
}

/**
 * A Bulma styled textarea element.
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ error, loading, name, onChange, readOnly, id = name, ...props }, ref) => {
    const handleChange = useCallback(
      (event: ChangeEvent<HTMLTextAreaElement>) => {
        onChange(event, event.currentTarget.value);
      },
      [onChange],
    );

    return (
      <textarea
        {...props}
        className={classNames('textarea', {
          'has-background-white-bis': readOnly,
          'is-danger': error,
          'is-loading': loading,
        })}
        id={id}
        name={name}
        onChange={handleChange}
        readOnly={readOnly}
        ref={ref}
      />
    );
  },
);
