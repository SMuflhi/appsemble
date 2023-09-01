import { useBreadcrumbs } from '@appsemble/react-components';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { type ReactElement } from 'rehype-react/lib';

import { messages } from './messages.js';
import { useBreadCrumbsDecoration } from '../BreadCrumbsDecoration/index.js';

/**
 * Render breadcrumbs based on the `<MetaProvider />`.
 */
export function Breadcrumbs(): ReactElement {
  const breadcrumbs = useBreadcrumbs();
  const { formatMessage } = useIntl();

  const [decoration] = useBreadCrumbsDecoration();

  return (
    <div className="is-flex-tablet">
      <nav
        aria-label={formatMessage(messages.breadcrumbs)}
        className="breadcrumb is-flex-grow-0 is-flex-shrink-0 mr-4 my-0 py-2"
      >
        <ul>
          {breadcrumbs.map(({ title, url }, index) => {
            const current = index === breadcrumbs.length - 1;
            return (
              <li
                aria-current={current ? 'page' : null}
                className={current ? 'is-active' : null}
                // eslint-disable-next-line react/no-array-index-key
                key={index}
              >
                <Link relative="path" to={url}>
                  {title}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {decoration}
    </div>
  );
}
