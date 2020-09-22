import { ComponentProps, h } from 'preact';
import { forwardRef } from 'preact/compat';

import { FormComponent, Select, SharedFormComponentProps } from '..';

type SelectFieldProps = SharedFormComponentProps &
  Omit<ComponentProps<typeof Select>, keyof SharedFormComponentProps>;

/**
 * A Bulma styled form select element.
 */
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  (
    {
      fullWidth = true,
      className,
      help,
      label,
      required,
      icon,
      id = name,
      tag,
      optionalLabel,
      ...props
    },
    ref,
  ) => (
    <FormComponent
      className={className}
      help={help}
      icon={icon}
      id={id}
      label={label}
      optionalLabel={optionalLabel}
      required={required}
      tag={tag}
    >
      <Select fullWidth={fullWidth} id={id} name={name} ref={ref} required={required} {...props} />
    </FormComponent>
  ),
);