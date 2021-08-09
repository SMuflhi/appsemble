import { Title, useMeta } from '@appsemble/react-components';
import { defaultLocale, schemas } from '@appsemble/utils';
import decamelize from 'decamelize';
import { Fragment, ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { Schema } from '../../../../components/Schema';
import Introduction from './introduction.md';
import { messages } from './messages';
import { Ref } from './Ref';

const entries = Object.entries(schemas.ObjectRemapperDefinition.properties);

export function RemapperPage(): ReactElement {
  useMeta(messages.title, messages.description);

  return (
    <main lang={defaultLocale}>
      <Title anchor className="pl-4" id="action-reference">
        <FormattedMessage {...messages.title} />
      </Title>
      <div className="pl-6">
        <Introduction main={false} />
      </div>
      {entries.map(([name, schema]) => {
        const id = decamelize(name, { separator: '-' });

        return (
          <Fragment key={name}>
            <Title anchor className="pl-4 mb-1 mt-5" id={id} size={4}>
              {name}
            </Title>
            <div className="pl-6">
              <Schema anchors idPrefix={id} renderRef={Ref} schema={schema} />
            </div>
          </Fragment>
        );
      })}
    </main>
  );
}
