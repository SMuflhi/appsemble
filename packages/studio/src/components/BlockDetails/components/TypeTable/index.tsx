import { Join, Table } from '@appsemble/react-components';
import type { OpenAPIV3 } from 'openapi-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

interface TypeTableProps {
  definition: OpenAPIV3.SchemaObject;
}

export default function TypeTable({ definition }: TypeTableProps): React.ReactElement {
  return (
    <Table>
      <thead>
        <tr>
          <th>
            <FormattedMessage {...messages.type} />
          </th>
          <th>
            <FormattedMessage {...messages.format} />
          </th>
          <th>
            <FormattedMessage {...messages.enum} />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{definition.type}</td>
          <td>{definition.format}</td>
          <td>
            <Join separator=" | ">{(definition.enum || []).map((e) => `“${e}”`)}</Join>
          </td>
        </tr>
      </tbody>
    </Table>
  );
}
