import { Dropdown } from '@appsemble/react-components';
import { type ReactElement, useCallback } from 'react';

import styles from './index.module.css';
import { ListItem } from './ListItem/index.js';

interface InputStringProps {
  readonly label?: string;
  readonly labelPosition?: 'left' | 'top';
  readonly onChange: (index: number) => void;
  readonly value: string;
  readonly options: readonly string[];
  readonly size?: 'large' | 'medium' | 'normal' | 'small';
}

export function DropDownLabel(size: string, value: string): ReactElement {
  const val = value;
  let valueString;
  switch (size) {
    case 'large':
      valueString = val.length > 15 ? `${val.slice(0, 15)}...` : val;
      break;
    case 'medium':
      valueString = val.length > 10 ? `${val.slice(0, 10)}...` : val;
      break;
    case 'small':
      valueString = val.length > 7 ? `${val.slice(0, 7)}...` : val;
      break;
    default:
      valueString = val;
      break;
  }
  return <span className="px-1">{valueString}</span>;
}

export function InputList({
  label,
  labelPosition = 'top',
  onChange,
  options,
  size = 'normal',
  value,
}: InputStringProps): ReactElement {
  const onDropdownChange = useCallback(
    (index: number) => {
      onChange(index);
    },
    [onChange],
  );

  if (!label) {
    return (
      <div className={`${styles.root} field`}>
        <Dropdown className={styles.dropDown} label={DropDownLabel(size, value)}>
          {options.map((option, index) => (
            <ListItem index={index} key={option} onChange={onDropdownChange} value={option} />
          ))}
        </Dropdown>
      </div>
    );
  }

  return (
    <div
      className={`${styles.root} field ${
        labelPosition === 'left' ? styles.leftLabel : styles.topLabel
      }`}
    >
      <label className={styles.label}>{label}</label>
      <Dropdown className={styles.dropDown} label={DropDownLabel(size, value)}>
        {options.map((option, index) => (
          <ListItem index={index} key={option} onChange={onDropdownChange} value={option} />
        ))}
      </Dropdown>
    </div>
  );
}