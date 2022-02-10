import { FormattedMessage, useBlock } from '@appsemble/preact';
import { InputField, SliderField } from '@appsemble/preact-components';
import { VNode } from 'preact';

import { InputProps, NumberField } from '../../../block';
import { getMax, getMin, getStep, isRequired } from '../../utils/requirements';

type NumberInputProps = InputProps<number, NumberField>;

/**
 * An input element for a number type schema.
 */
export function NumberInput({
  dirty,
  disabled,
  error,
  field,
  name,
  onChange,
  value,
}: NumberInputProps): VNode {
  const { utils } = useBlock();
  const { bottomLabels, display, icon, label, placeholder, readOnly, tag, topLabels } = field;

  const commonProps = {
    className: 'appsemble-number',
    disabled,
    error: dirty && error,
    icon,
    label,
    max: getMax(field),
    min: getMin(field),
    name,
    onChange,
    optionalLabel: <FormattedMessage id="optionalLabel" />,
    readOnly,
    required: isRequired(field),
    step: getStep(field),
    tag: utils.remap(tag, value) as string,
    value,
  };

  if (display === 'slider') {
    return (
      <SliderField
        {...commonProps}
        bottomLabels={bottomLabels?.map((bottomLabel) => utils.remap(bottomLabel, value) as string)}
        onChange={onChange}
        topLabels={topLabels?.map((topLabel) => utils.remap(topLabel, value) as string)}
      />
    );
  }

  return (
    <InputField
      icon={icon}
      placeholder={
        (utils.remap(placeholder, value) as string) ||
        (utils.remap(label, value) as string) ||
        field.name
      }
      type="number"
      {...commonProps}
    />
  );
}
