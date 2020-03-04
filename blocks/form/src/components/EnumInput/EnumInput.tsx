/** @jsx h */
import { Select } from '@appsemble/preact-components';
import classNames from 'classnames';
import { h, VNode } from 'preact';

import { EnumField, InputProps } from '../../../block';
import styles from './EnumInput.css';

type EnumInputProps = InputProps<string, EnumField>;

/**
 * Render a select box which offers choices a JSON schema enum.
 */
export default function EnumInput({ disabled, field, onInput, value = '' }: EnumInputProps): VNode {
  return (
    <Select
      disabled={disabled}
      iconLeft={field.icon}
      id={field.name}
      label={field.label ?? field.name}
      name={field.name}
      onInput={onInput}
      required={field.required}
      value={value}
    >
      {(!field.required || !value) && (
        <option className={classNames({ [styles.hidden]: field.required })} value={null}>
          {field.placeholder ?? ''}
        </option>
      )}
      {field.enum.map(choice => (
        <option key={choice.value} value={choice.value}>
          {choice.label ?? choice.value}
        </option>
      ))}
    </Select>
  );
}
