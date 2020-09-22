import { Button, Title } from '@appsemble/react-components';
import type { NamedEvent } from '@appsemble/web-utils';
import type { OpenAPIV3 } from 'openapi-types';
import React, { MouseEvent, ReactElement, useCallback } from 'react';

import { JSONSchemaLabel } from '../JSONSchemaLabel';
import { RecursiveJSONSchemaEditor } from '../RecursiveJSONSchemaEditor';
import type { CommonJSONSchemaEditorProps } from '../types';
import styles from './index.css';

const defaults = {
  array: [] as const,
  boolean: false,
  integer: 0,
  object: {},
  null: null as null,
  number: 0,
  string: '',
};

export function JSONSchemaArrayEditor({
  disabled,
  name,
  prefix,
  onChange,
  schema,
  value = [],
}: CommonJSONSchemaEditorProps<any[]>): ReactElement {
  const items = (schema as OpenAPIV3.ArraySchemaObject).items as OpenAPIV3.SchemaObject;

  const onPropertyChange = useCallback(
    ({ currentTarget }: NamedEvent, val) => {
      const index = Number(currentTarget.name.slice(name.length + 1));
      onChange(
        { currentTarget: { name } },
        value.map((v, i) => (i === index ? val : v)),
      );
    },
    [onChange, name, value],
  );

  const removeItem = useCallback(
    ({ currentTarget }: MouseEvent<HTMLButtonElement>) => {
      const index = Number(currentTarget.name.slice(name.length + 1));
      onChange(
        { currentTarget: { name } },
        value.filter((_val, i) => i !== index),
      );
    },
    [onChange, name, value],
  );

  const onItemAdded = useCallback(
    ({ currentTarget }: MouseEvent<HTMLButtonElement>) => {
      const addedName = currentTarget.name;
      const index = addedName ? Number(addedName.slice(addedName.length + 1)) + 1 : 0;
      onChange({ currentTarget: { name } }, [
        ...value.slice(0, index),
        items.default ?? defaults[items.type],
        ...value.slice(index, value.length),
      ]);
    },
    [items, onChange, name, value],
  );

  return (
    <div className={`${styles.root} px-3 py-3 my-2 mx-0`}>
      <Button className="is-pulled-right" color="success" icon="plus" onClick={onItemAdded} />
      <Title className={styles.title} level={5}>
        <JSONSchemaLabel name={name} prefix={prefix} schema={schema} />
      </Title>
      {value.map((val, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={index}>
          <RecursiveJSONSchemaEditor
            disabled={disabled}
            name={`${name}.${index}`}
            onChange={onPropertyChange}
            prefix={prefix}
            schema={items}
            value={val}
          />
          <div className="is-pulled-right">
            <Button color="danger" icon="minus" name={`${name}.${index}`} onClick={removeItem} />
            <Button color="success" icon="plus" name={`${name}.${index}`} onClick={onItemAdded} />
          </div>
          <hr />
        </div>
      ))}
    </div>
  );
}