/** @jsx h */
import { useBlock } from '@appsemble/preact';
import { Fragment, h, VNode } from 'preact';

import type { RendererProps, StringField } from '../../../block';

/**
 * An element for a text type schema.
 */
export default function StringRenderer({ data, field }: RendererProps<StringField>): VNode {
  const { utils } = useBlock();

  const label = utils.remap(field.label, data);
  const value = utils.remap(field.name, data);

  return (
    <Fragment>
      {label ? <h6 className="title is-6">{label}</h6> : null}
      {value ? (
        <div className="content">{typeof value === 'string' ? value : JSON.stringify(value)}</div>
      ) : null}
    </Fragment>
  );
}
