import classNames from 'classnames';
import * as React from 'react';

import FormComponent from '../FormComponent';

type CheckboxProps = Omit<React.ComponentPropsWithoutRef<typeof FormComponent>, 'children'> &
  Omit<React.ComponentPropsWithoutRef<'input'>, 'value' | 'label' | 'onChange'> & {
    error?: any;

    /**
     * The name of the HTML element.
     */
    name: string;

    /**
     * A help message to render next to the checkbox.
     */
    help?: React.ReactNode;

    /**
     * This is fired when the input value has changed.
     */
    onChange: (event: React.ChangeEvent<HTMLInputElement>, value: boolean) => void;

    /**
     * Whether or not the checkbox is checked.
     */
    value?: boolean;
  };

/**
 * A Bulma styled form select element.
 */
export default class Checkbox extends React.Component<CheckboxProps> {
  onChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { onChange } = this.props;

    onChange(event, event.target.checked);
  };

  render(): JSX.Element {
    const { className, error, help, label, name, value, id = name, ...props } = this.props;

    return (
      <FormComponent id={id} label={label} required>
        <input
          {...props}
          checked={value}
          className={classNames('is-checkradio', className)}
          id={id}
          name={name}
          onChange={this.onChange}
          type="checkbox"
        />
        {help && (
          <label className={classNames({ 'is-danger': error })} htmlFor={id}>
            {help}
          </label>
        )}
      </FormComponent>
    );
  }
}
