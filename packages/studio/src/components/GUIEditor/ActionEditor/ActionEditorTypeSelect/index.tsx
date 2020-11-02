import { SelectField } from '@appsemble/react-components';
import { ActionDefinition } from '@appsemble/types';
import React, { ChangeEvent, ReactElement, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages';

interface ActionEditorTypeSelectProps {
  onChange: (value: ActionDefinition['type']) => void;
  value: ActionDefinition['type'];
}

export function ActionEditorTypeSelect({
  onChange,
  value,
}: ActionEditorTypeSelectProps): ReactElement {
  const actionDefinitions: ActionDefinition['type'][] = [
    'dialog',
    'event',
    'flow.back',
    'flow.cancel',
    'flow.finish',
    'flow.next',
    'link',
    'log',
    'message',
    'noop',
    'request',
    'resource.create',
    'resource.delete',
    'resource.get',
    'resource.query',
    'resource.subscription.status',
    'resource.subscription.subscribe',
    'resource.subscription.toggle',
    'resource.subscription.unsubscribe',
    'resource.update',
    'static',
  ];

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const actionType = event.currentTarget.value as ActionDefinition['type'];
      onChange(actionType);
    },
    [onChange],
  );

  return (
    <SelectField
      label={<FormattedMessage {...messages.actionType} />}
      name="type"
      onChange={handleChange}
      value={value}
    >
      <FormattedMessage {...messages.empty} tagName="option" />
      {actionDefinitions.map((action: string) => (
        <option key={action} value={action}>
          {action}
        </option>
      ))}
    </SelectField>
  );
}
