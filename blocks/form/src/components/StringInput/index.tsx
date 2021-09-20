import { useBlock } from '@appsemble/preact';
import { InputField, TextAreaField } from '@appsemble/preact-components';
import { VNode } from 'preact';

import { InputProps, StringField } from '../../../block';
import { getMaxLength, getMinLength, isRequired } from '../../utils/requirements';

type StringInputProps = InputProps<string, StringField>;

/**
 * An input element for a text type schema.
 */
export function StringInput({
  dirty,
  disabled,
  error,
  field,
  name,
  onChange,
  value,
}: StringInputProps): VNode {
  const { utils } = useBlock();
  const { format, icon, label, multiline, placeholder, readOnly, tag } = field;

  const remappedLabel = utils.remap(label, value) ?? name;
  const commonProps = {
    className: 'appsemble-string',
    disabled,
    error: dirty && error,
    iconLeft: icon,
    label: remappedLabel as string,
    maxLength: getMaxLength(field),
    minLength: getMinLength(field),
    name,
    onChange,
    optionalLabel: utils.formatMessage('optionalLabel'),
    placeholder: (utils.remap(placeholder, value) ?? remappedLabel) as string,
    readOnly,
    required: isRequired(field),
    tag: utils.remap(tag, value) as string,
    value,
  };

  return multiline ? (
    <TextAreaField {...commonProps} />
  ) : (
    <InputField {...commonProps} type={format} />
  );
}
