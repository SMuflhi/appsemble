import classNames from 'classnames';
import * as React from 'react';

import styles from './index.css';

interface DotProgressBarProps {
  amount: number;
  active: number;
}

export default function DotProgressBar({
  active,
  amount,
}: DotProgressBarProps): React.ReactElement {
  return (
    <div className={styles.dotContainer}>
      {Array.from(Array(amount), (_, index) => (
        <div
          key={index}
          className={classNames(styles.dot, {
            [styles.previous]: index < active,
            [styles.active]: index === active,
          })}
        />
      ))}
    </div>
  );
}
