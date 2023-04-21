import { Schema } from 'jsonschema';
import { JsonValue } from 'type-fest';

export const generateData = (
  schema: Schema,
  definitions: Record<string, Schema>,
  ownerKey = '',
): JsonValue => {
  if (schema.$ref) {
    const ref = decodeURIComponent(schema.$ref.split('/').pop());
    return generateData(definitions[ref!] as Schema, definitions);
  }
  if (schema.default) {
    return schema.default;
  }
  if (schema.type === 'object') {
    const data: Record<string, JsonValue> = {};
    if (schema.properties) {
      for (const key of Object.keys(schema.properties)) {
        data[key] = generateData(schema.properties[key], definitions, key);
      }
    }
    /* If (typeof schema.required !== 'boolean' && schema.required?.length) {
      for (const key of schema.required || []) {
        data[key] = generateData(schema.properties![key], definitions);
      }
    } */
    return data;
  }
  if (schema.anyOf) {
    return [generateData(schema.anyOf[0], definitions)];
  }
  if (schema.oneOf) {
    return generateData(schema.oneOf[0], definitions);
  }
  if (schema.allOf) {
    const allOf = [];
    for (const allOfSchema of schema.allOf) {
      allOf.push(generateData(allOfSchema, definitions));
    }
    return allOf;
  }
  if (schema.enum) {
    return schema.enum[0];
  }
  if (schema.format === 'remapper') {
    return ownerKey;
  }
  if (schema.type === 'array') {
    return Array.from({ length: 1 }, (empty, index) =>
      generateData(
        Array.isArray(schema.items)
          ? schema.items[index] ||
              (typeof schema.additionalItems === 'object' && schema.additionalItems)
          : schema.items,
        definitions,
      ),
    );
  }
  if (schema.type === 'string') {
    if (schema.format === 'fontawesome') {
      return 'fas fa-home';
    }
    if (schema.const) {
      return schema.const;
    }
    return '';
  }
  if (schema.type === 'number') {
    return 0;
  }
  if (schema.type === 'boolean') {
    return false;
  }
  return null;
};
