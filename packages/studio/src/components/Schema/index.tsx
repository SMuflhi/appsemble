import { Join, MarkdownContent, Title } from '@appsemble/react-components';
import { combineSchemas } from '@appsemble/utils';
import classNames from 'classnames';
import decamelize from 'decamelize';
import { Schema as SchemaType } from 'jsonschema';
import { FC, ReactElement, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages';
import { SchemaDescriptor } from './SchemaDescriptor';

export interface RenderRefProps {
  isArray: boolean;

  jsonRef: string;
}

interface SchemaProps {
  /**
   * If this is true, anchors will be rendered for all properties.
   */
  anchors?: boolean;

  /**
   * If specified, use this prefix for the generated title ID.
   */
  idPrefix?: string;

  /**
   * The JSON schema to render
   */
  schema: SchemaType;

  /**
   * The name of the propery to render for nested a nested schema.
   */
  name?: string;

  /**
   * Whether or not the schema is nested.
   */
  nested?: boolean;

  /**
   * A component used to render found JSON references.
   */
  renderRef?: FC<RenderRefProps>;

  /**
   * Whether or not the schema is required by its parent schema.
   */
  required?: boolean;
}

/**
 * Render a JSON schema into readable API documentation.
 */
export function Schema({
  anchors,
  idPrefix,
  name,
  nested,
  renderRef: RenderRef = null,
  required,
  schema,
}: SchemaProps): ReactElement {
  const mergedSchema = useMemo(
    () => (schema.allOf ? combineSchemas(...schema.allOf) : schema),
    [schema],
  );

  const description =
    nested &&
    (mergedSchema.description ||
      (mergedSchema.items && !Array.isArray(mergedSchema.items) && mergedSchema.items.description));

  let id = idPrefix;
  if (name) {
    id = decamelize(name, { separator: '-' });
    if (idPrefix) {
      id = `${idPrefix}-${id}`;
    }
  }

  return (
    <div className={nested ? `${styles.nested} px-3 py-3 my-2 mx-0` : ''}>
      {name ? (
        <div className={classNames('pb-2', { [styles.hasAnchor]: anchors })}>
          <Title anchor={anchors} className="is-inline-block is-marginless" id={id} size={5}>
            {mergedSchema.title ? (
              <>
                <span className="mr-1">{mergedSchema.title}</span>
                <span className="has-text-weight-normal has-text-grey-light">({name})</span>
              </>
            ) : (
              name
            )}
          </Title>
          {(required || mergedSchema.required === true) && (
            <span className="ml-2 tag is-info">
              <FormattedMessage {...messages.required} />
            </span>
          )}
        </div>
      ) : null}
      {nested &&
        (mergedSchema.$ref || mergedSchema.type ? (
          <SchemaDescriptor label={<FormattedMessage {...messages.type} />}>
            <code>
              {mergedSchema.$ref
                ? RenderRef && <RenderRef isArray={false} jsonRef={mergedSchema.$ref} />
                : mergedSchema.type === 'array'
                ? !mergedSchema.items || Array.isArray(mergedSchema.items)
                  ? 'array'
                  : mergedSchema.items.type
                  ? `${mergedSchema.items.type}[]`
                  : mergedSchema.items.$ref
                  ? RenderRef && <RenderRef isArray jsonRef={mergedSchema.items.$ref} />
                  : 'array'
                : mergedSchema.type}
            </code>
          </SchemaDescriptor>
        ) : null)}
      {mergedSchema.default != null && (
        <SchemaDescriptor label={<FormattedMessage {...messages.default} />}>
          <code>{JSON.stringify(mergedSchema.default)}</code>
        </SchemaDescriptor>
      )}
      {mergedSchema.enum?.length ? (
        <SchemaDescriptor label={<FormattedMessage {...messages.options} />}>
          <Join separator=" | ">
            {mergedSchema.enum.map((option) => (
              <code key={option}>{JSON.stringify(option)}</code>
            ))}
          </Join>
        </SchemaDescriptor>
      ) : null}
      {mergedSchema.format ? (
        <SchemaDescriptor label={<FormattedMessage {...messages.format} />}>
          {mergedSchema.format}
        </SchemaDescriptor>
      ) : null}
      {mergedSchema.minItems > 0 && (
        <SchemaDescriptor label={<FormattedMessage {...messages.minItems} />}>
          {mergedSchema.minItems}
        </SchemaDescriptor>
      )}
      {mergedSchema.maxItems > 0 && (
        <SchemaDescriptor label={<FormattedMessage {...messages.maxItems} />}>
          {mergedSchema.maxItems}
        </SchemaDescriptor>
      )}
      {mergedSchema.minLength > 0 && (
        <SchemaDescriptor label={<FormattedMessage {...messages.minLength} />}>
          {mergedSchema.minLength}
        </SchemaDescriptor>
      )}
      {mergedSchema.maxLength > 0 && (
        <SchemaDescriptor label={<FormattedMessage {...messages.maxLength} />}>
          {mergedSchema.maxLength}
        </SchemaDescriptor>
      )}
      {mergedSchema.minimum > 0 && (
        <SchemaDescriptor label={<FormattedMessage {...messages.minimum} />}>
          {mergedSchema.minimum}
        </SchemaDescriptor>
      )}
      {mergedSchema.maximum > 0 && (
        <SchemaDescriptor label={<FormattedMessage {...messages.maximum} />}>
          {mergedSchema.maximum}
        </SchemaDescriptor>
      )}
      {mergedSchema.pattern && (
        <SchemaDescriptor label={<FormattedMessage {...messages.pattern} />}>
          <code>{mergedSchema.pattern ?? 'foo'}</code>
        </SchemaDescriptor>
      )}
      {nested && description && <MarkdownContent content={description} />}
      {mergedSchema.type === 'object' && mergedSchema.properties
        ? Object.entries(mergedSchema.properties).map(([propertyName, property]) => (
            <Schema
              anchors={anchors}
              idPrefix={id}
              key={propertyName}
              name={propertyName}
              nested
              renderRef={RenderRef}
              required={
                Array.isArray(mergedSchema.required) &&
                mergedSchema.required?.includes(propertyName)
              }
              schema={property}
            />
          ))
        : null}
      {mergedSchema.type === 'array' &&
        mergedSchema.items &&
        !Array.isArray(mergedSchema.items) &&
        Object.entries(mergedSchema.items.properties ?? {}).map(([propertyName, property]) => (
          <Schema
            anchors={anchors}
            idPrefix={id}
            key={propertyName}
            name={propertyName}
            nested
            renderRef={RenderRef}
            required={
              typeof (schema.items as SchemaType).required === 'object' &&
              ((schema.items as SchemaType).required as string[]).includes(propertyName)
            }
            schema={property}
          />
        ))}
    </div>
  );
}
