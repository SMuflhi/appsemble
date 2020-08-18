import classNames from 'classnames';
import React, { Children, ReactElement, ReactNode } from 'react';

import styles from './index.css';

interface FormButtonsProps {
  children: ReactNode;
  className?: string;
}

/**
 * A wrapper for form buttons.
 *
 * If one element is padded, it’s aligned to the right. If more are defined, space is added between
 * them.
 */
export function FormButtons({ children, className }: FormButtonsProps): ReactElement {
  const count = Children.count(children);

  return (
    <div className={classNames(styles.root, count > 1 ? styles.multiple : styles.one, className)}>
      {children}
    </div>
  );
}
