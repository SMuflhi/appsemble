import { ReactElement, useCallback } from 'react';

import { CollapsibleList } from '../../CollapsibleList';
import { JSONSchemaLabel } from '../JSONSchemaLabel';
import { RecursiveJSONSchemaEditor } from '../RecursiveJSONSchemaEditor';
import { CommonJSONSchemaEditorProps } from '../types';
import styles from './index.module.css';

export function JSONSchemaObjectEditor({
  disabled,
  name,
  onChange,
  nested,
  prefix,
  schema,
  value = {},
}: CommonJSONSchemaEditorProps<Record<string, string>>): ReactElement {
  const onPropertyChange = useCallback(
    ({ currentTarget }, val) => {
      const id = currentTarget.name.slice(name.length + 1);
      onChange({ currentTarget: { name } }, { ...value, [id]: val });
    },
    [name, onChange, value],
  );

  return (
    <div className={nested ? `${styles.nested} px-3 py-3 my-2 mx-0` : null}>
      <CollapsibleList
        level={5}
        size={3}
        title={<JSONSchemaLabel name={name} prefix={prefix} schema={schema} />}
      >
        {Object.entries(schema?.properties ?? {}).map(([propName, subSchema]) => (
          <RecursiveJSONSchemaEditor
            disabled={disabled}
            key={propName}
            name={name ? `${name}.${propName}` : propName}
            onChange={onPropertyChange}
            prefix={prefix}
            required={
              (Array.isArray(schema.required) && schema.required.includes(propName)) ||
              subSchema.required === true
            }
            schema={subSchema}
            value={value?.[propName]}
          />
        ))}
      </CollapsibleList>
    </div>
  );
}
