import { useBlock } from '@appsemble/preact';
import { DateTimeField as DateTimeComponent } from '@appsemble/preact-components';
import { JSX, VNode } from 'preact';
import { useCallback, useMemo } from 'preact/hooks';

import { DateField, InputProps } from '../../../block';
import { useLocale } from '../../hooks/useLocale';
import { extractDate } from '../../utils/extractDate';
import { getDisabledDays, getMaxDate, getMinDate, isRequired } from '../../utils/requirements';

type DateTimeInputProps = InputProps<string, DateField>;

/**
 * An input element for a date value.
 */
export function DateInput({
  dirty,
  disabled,
  error,
  field,
  onChange,
  value = null,
}: DateTimeInputProps): VNode {
  const { utils } = useBlock();
  const { label, name, placeholder, readOnly, tag } = field;

  const dateLabel = utils.remap(label, value) as string;

  const required = isRequired(field);

  const handleOnChange = useCallback(
    (event: JSX.TargetedEvent<HTMLInputElement>, v: string): void =>
      onChange(event, extractDate(new Date(v))),
    [onChange],
  );

  const maxDate = useMemo(() => extractDate(getMaxDate(field, utils)), [field, utils]);
  const minDate = useMemo(() => extractDate(getMinDate(field, utils)), [field, utils]);
  const disable = useMemo(() => getDisabledDays(field), [field]);

  const locale = useLocale(field);

  return (
    <DateTimeComponent
      disable={disable}
      disabled={disabled}
      error={dirty && error}
      id={name}
      label={dateLabel}
      locale={locale}
      maxDate={maxDate}
      minDate={minDate}
      name={name}
      onChange={handleOnChange}
      optionalLabel={utils.formatMessage('optionalLabel')}
      placeholder={(utils.remap(placeholder, value) as string) || dateLabel || name}
      readOnly={readOnly}
      required={required}
      tag={utils.remap(tag, value) as string}
      value={value}
    />
  );
}
