import { useBlock } from '@appsemble/preact';
import { RadioButton, RadioGroup } from '@appsemble/preact-components';
import { VNode } from 'preact';

import { InputProps, RadioField } from '../../../block';
import { isRequired } from '../../utils/requirements';
import styles from './index.module.css';

type RadioInputProps = InputProps<any, RadioField>;

/**
 * An input element for a radio button.
 */
export function RadioInput({
  dirty,
  disabled,
  error,
  field,
  name,
  onChange,
  value,
}: RadioInputProps): VNode {
  const {
    parameters: { optionalLabel },
    utils,
  } = useBlock();
  const { label, options, tag } = field;
  const required = isRequired(field);

  return (
    <RadioGroup
      className="appsemble-radio"
      disabled={disabled}
      error={dirty && error}
      label={utils.remap(label, value)}
      name={name}
      onChange={onChange}
      optionalLabel={utils.remap(optionalLabel, value)}
      required={required}
      tag={utils.remap(tag, value)}
      value={value}
    >
      {options.map((option, index) => {
        const id = `${name}.${index}`;
        return (
          <RadioButton
            disabled={disabled}
            id={id}
            key={id}
            required={required}
            value={option.value}
            wrapperClassName={styles.choice}
          >
            {utils.remap(option.label, {}) ?? option.value}
          </RadioButton>
        );
      })}
    </RadioGroup>
  );
}
