import { camelToHyphen } from '@appsemble/utils';
import { type ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { type RenderRefProps } from '../../../../../components/Schema/index.js';

export function Ref({ isArray, jsonRef }: RenderRefProps): ReactElement {
  const name = jsonRef.split('/').pop();

  return (
    <>
      {name === 'ActionDefinition' ? (
        'ActionDefinition'
      ) : (
        <Link
          to={name === 'RemapperDefinition' ? '../../remapper' : `./app#${camelToHyphen(name)}`}
        >
          {name}
        </Link>
      )}
      {isArray ? '[]' : null}
    </>
  );
}
