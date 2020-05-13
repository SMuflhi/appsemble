import { Title } from '@appsemble/react-components/src';
import type { OpenAPIV3 } from 'openapi-types';
import * as React from 'react';

import type { CommonJSONSchemaEditorProps } from '../../types';
import JSONSchemaLabel from '../JSONSchemaLabel';
import RecursiveJSONSchemaEditor from '../RecursiveJSONSchemaEditor';
import styles from './index.css';

export default function JSONSchemaObjectEditor({
  disabled,
  name,
  onChange,
  nested,
  prefix,
  schema,
  value = {},
}: CommonJSONSchemaEditorProps<{ [key: string]: string }>): React.ReactElement {
  const onPropertyChange = React.useCallback(
    ({ target }, val) => {
      const id = target.name.slice(name.length + 1);
      onChange({ target: { name } }, { ...value, [id]: val });
    },
    [name, onChange, value],
  );

  return (
    <div className={nested ? styles.nested : null}>
      <Title level={5}>
        <JSONSchemaLabel name={name} prefix={prefix} schema={schema} />
      </Title>
      {Object.entries(schema?.properties ?? {}).map(([propName, subSchema]) => (
        <RecursiveJSONSchemaEditor
          key={propName}
          disabled={disabled}
          name={name ? `${name}.${propName}` : propName}
          onChange={onPropertyChange}
          prefix={prefix}
          required={schema.required?.includes(propName)}
          schema={subSchema as OpenAPIV3.SchemaObject}
          value={value?.[propName]}
        />
      ))}
    </div>
  );
}
