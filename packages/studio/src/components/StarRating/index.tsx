import { Icon } from '@appsemble/react-components';
import classNames from 'classnames';
import React, { MouseEvent, ReactElement, useCallback, useEffect, useState } from 'react';

import styles from './index.css';

export interface StarRatingProps {
  /**
   * An optional additional class name to add to the root element.
   */
  className?: string;

  /**
   * An optional rating count.
   *
   * This will be rendered wrapped in brackets after the stars.
   */
  count?: number;

  /**
   * The name for the buttons.
   *
   * This is useful if the component is used as a form element.
   */
  name?: string;

  /**
   * The change event that is triggered if a star is clicked.
   *
   * Specifying this makes the component interactive.
   */
  onChange?: (event: MouseEvent<HTMLButtonElement>, value: number) => void;

  /**
   * The current rating value.
   */
  value?: number;
}

/**
 * Render a star rating component.
 */
export function StarRating({
  className,
  count,
  name,
  onChange,
  value,
}: StarRatingProps): ReactElement {
  const [localRating, setLocalRating] = useState(value);

  const onClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onChange(event, Number(event.currentTarget.value));
    },
    [onChange],
  );

  const onMouseLeave = useCallback(() => setLocalRating(value), [value]);

  const onMouseEnter = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => setLocalRating(Number(event.currentTarget.value)),
    [],
  );

  useEffect(() => {
    setLocalRating(value);
  }, [value]);

  const inactiveIcons = [];
  const activeIcons = [];

  for (let i = 1; i < 6; i += 1) {
    if (onChange) {
      activeIcons.push(
        <button
          className={`icon ${styles.starButton} is-medium`}
          key={i}
          name={name}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          type="button"
          value={i}
        >
          <i className={`fas fa-star fa-2x ${styles.starIcon}`} />
        </button>,
      );
      inactiveIcons.push(
        <button
          className={`icon ${styles.starButton} is-medium`}
          key={i}
          name={name}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          type="button"
          value={i}
        >
          <i className={`far fa-star fa-2x ${styles.starIcon}`} />
        </button>,
      );
    } else {
      activeIcons.push(<Icon className={styles.starIcon} icon="star" key={i} prefix="fas" />);
      inactiveIcons.push(<Icon className={styles.starIcon} icon="star" key={i} prefix="far" />);
    }
  }

  return (
    <span className={classNames(styles.container, className)}>
      <div className={styles.wrapper}>
        <span className={styles.starsInactive}>{inactiveIcons}</span>
        {/* eslint-disable-next-line react/forbid-dom-props */}
        <span className={styles.starsActive} style={{ width: `${localRating * 20}%` }}>
          {activeIcons}
        </span>
      </div>
      {count == null || <span>({count})</span>}
    </span>
  );
}
