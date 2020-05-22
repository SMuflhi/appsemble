import { Title } from '@appsemble/react-components/src';
import type { Action } from '@appsemble/sdk';
import type { ActionType, App } from '@appsemble/types';
import React from 'react';

import type { NamedEvent } from '../../../../types';
import ActionEditorTypeEditor from './components/ActionEditorTypeEditor';
import ActionEditorTypeSelect from './components/ActionEditorTypeSelect';
import styles from './index.css';

interface ActionEditorProps {
  actions: { [action: string]: ActionType };
  app: App;
  onChange: (event: NamedEvent, value?: any) => void;
  value: any;
}

export default function ActionEditor({
  actions,
  app,
  onChange,
  value = {},
}: ActionEditorProps): React.ReactElement {
  const [selectedActionType, setSelectedActionType] = React.useState<{
    [actionName: string]: Action['type'];
  }>({});

  const handleChange = React.useCallback(
    (event, val) => {
      onChange(event.target.name, val);
    },
    [onChange],
  );

  React.useEffect(() => {
    const getActionTypes = (): void[] =>
      Object.keys(actions).map((key: string): void => {
        if (value[key]) {
          if (value[key].type) {
            setSelectedActionType({ [key]: value[key].type });
          }
        }
        return value;
      });
    getActionTypes();
  }, [setSelectedActionType, value, actions]);

  return (
    <div>
      {Object.keys(actions).map((key: string) => (
        <div key={key}>
          <Title className={styles.marginTop} level={5}>
            {key}
          </Title>

          {!selectedActionType[key] ? (
            <ActionEditorTypeSelect name={key} setSelectedActionType={setSelectedActionType} />
          ) : (
            <>
              <ActionEditorTypeSelect
                name={selectedActionType[key]}
                setSelectedActionType={setSelectedActionType}
              />

              <ActionEditorTypeEditor
                app={app}
                name={key}
                onChange={handleChange}
                selectedActionType={selectedActionType}
                value={value}
              />
            </>
          )}
        </div>
      ))}
    </div>
  );
}
