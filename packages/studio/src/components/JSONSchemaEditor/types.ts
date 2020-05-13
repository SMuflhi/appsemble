import type { OpenAPIV3 } from 'openapi-types';

import type { NamedEvent } from '../../types';

export interface CommonJSONSchemaEditorProps<
  T = never,
  S extends OpenAPIV3.BaseSchemaObject = OpenAPIV3.NonArraySchemaObject
> {
  /**
   * Whether or not the editor is disabled.
   *
   * This value is recursively passed down to all child inputs.
   */
  disabled?: boolean;

  /**
   * The name of the property thas is being rendered.
   *
   * The name is determined by the parent schema. It is used for recursion.
   */
  name: string;

  /**
   * Whether or not this is a nested component.
   */
  nested?: boolean;

  /**
   * The handler that is called whenever a value changes.
   */
  onChange: (event: NamedEvent, value?: T) => void;

  /**
   * The prefix to remove from labels.
   */
  prefix: string;

  /**
   * Whether or not the property is required.
   *
   * This is determined by the parent schema. It is used for recursion.
   */
  required?: boolean;

  /**
   * The schema used to render the form elements.
   */
  schema: S;

  /**
   * The value used to populate the editor.
   */
  value: T;
}
