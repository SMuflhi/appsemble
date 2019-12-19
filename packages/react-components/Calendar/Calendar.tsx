import BulmaCalendar, { Options } from 'bulma-calendar';
import classNames from 'classnames';
import * as React from 'react';

import FormComponent from '../FormComponent';
import Icon from '../Icon';
import styles from './Calendar.css';

type CalendarProps = Omit<React.ComponentPropsWithoutRef<typeof FormComponent>, 'children'> &
  Omit<React.ComponentPropsWithoutRef<'input'>, 'label' | 'onChange'> & {
    control?: React.ReactElement;

    displayMode?: Options['displayMode'];

    /**
     * An error message to render.
     */
    error?: React.ReactNode;

    /**
     * A help message to render.
     */
    help?: React.ReactNode;

    /**
     * The name of the HTML element.
     */
    name: string;

    /**
     * This is fired when the input value has changed.
     *
     * If the input type is `checkbox`, the value is a boolean. If the input type is `number`, the
     * value is a number, otherwise it is a string.
     */
    onChange: (event: { target: HTMLInputElement }, value: Date) => void;

    showHeader?: boolean;

    /**
     * The HTML input type.
     *
     * This may be extended if necessary.
     */
    type?: 'date' | 'time' | 'datetime';
  };

/**
 * A Bulma styled form input element.
 */
export default React.forwardRef<HTMLInputElement, CalendarProps>(
  (
    {
      control,
      displayMode,
      error,
      iconLeft,
      help,
      label,
      maxLength,
      name,
      onChange,
      required,
      showHeader = false,
      type = 'datetime',
      value,
      id = name,
      ...props
    },
    ref,
  ) => {
    const inputRef = React.useRef<HTMLInputElement>();
    const calendarRef = React.useRef<BulmaCalendar>();

    React.useImperativeHandle(ref, () => inputRef.current);
    React.useEffect(() => {
      calendarRef.current = new BulmaCalendar(inputRef.current, {
        showHeader,
        type,
        displayMode,
      });
    }, [displayMode, showHeader, type]);

    React.useEffect(() => {
      calendarRef.current.on('select', () => {
        onChange({ target: inputRef.current }, calendarRef.current.startDate);
      });

      return () => {
        calendarRef.current.removeListeners('select');
      };
    }, [onChange]);

    return (
      <FormComponent
        iconLeft={iconLeft}
        iconRight={!!control}
        id={id}
        label={label}
        required={required}
      >
        <input
          {...props}
          ref={inputRef}
          id={id}
          maxLength={maxLength}
          name={name}
          required={required}
          value={value}
        />
        {iconLeft && <Icon className="is-left" icon={iconLeft} />}
        {control && React.cloneElement(control, { className: 'is-right' })}
        <div className={styles.help}>
          <p className={classNames('help', { 'is-danger': error })}>
            {React.isValidElement(error) ? error : help}
          </p>
          {maxLength ? (
            <span className={`help ${styles.counter}`}>{`${
              `${value}`.length
            } / ${maxLength}`}</span>
          ) : null}
        </div>
      </FormComponent>
    );
  },
);
