import React, { ComponentPropsWithoutRef, forwardRef, ReactElement, ReactNode } from 'react';

import { Checkbox, FormComponent, SharedFormComponentProps } from '..';

type CheckboxFieldProps = SharedFormComponentProps &
  Omit<ComponentPropsWithoutRef<typeof Checkbox>, 'error'> & {
    /**
     * The title to display right of the checkbox.
     */
    title?: ReactNode;

    /**
     * The class used for the FormComponent wrapper.
     */
    wrapperClassName?: string;
  };

/**
 * A Bulma styled form select element.
 */
export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  (
    { wrapperClassName, error, help = null, label, name, id = name, title, ...props },
    ref,
  ): ReactElement => (
    <FormComponent className={wrapperClassName} help={help} id={id} label={label} required>
      <Checkbox {...props} error={Boolean(error)} id={id} label={title} name={name} ref={ref} />
    </FormComponent>
  ),
);
