import { useBlock } from '@appsemble/preact';
import { ButtonGroup, ButtonOption } from '@appsemble/preact-components';
import classNames from 'classnames';
import { h, VNode } from 'preact';

import type { ButtonsField, FieldComponentProps } from '../../../block';
import styles from './index.css';

export default function ButtonsFieldComponent({
  className,
  field,
  highlight,
  loading,
  onChange,
  value,
}: FieldComponentProps<ButtonsField>): VNode {
  const { utils } = useBlock();

  return (
    <ButtonGroup
      className={`is-flex ${className} ${styles.root}`}
      name={field.name}
      onChange={onChange}
      value={value}
    >
      {field.options.map(({ icon, label, value: val }) => (
        <ButtonOption
          activeClassName="is-primary is-selected"
          className={classNames(styles.button, { 'is-marginless': highlight })}
          icon={icon}
          loading={loading}
          multiple
          value={val}
        >
          {utils.remap(label, {}) || value}
        </ButtonOption>
      ))}
    </ButtonGroup>
  );
}