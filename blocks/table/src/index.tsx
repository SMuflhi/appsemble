/** @jsx h */
import { BlockProps, bootstrap, FormattedMessage } from '@appsemble/preact';
import { Loader } from '@appsemble/preact-components';
import { remapData } from '@appsemble/utils';
import { h, VNode } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

import { Field } from '../block';
import styles from './index.css';

const messages = {
  error: 'An error occurred when fetching the data.',
  noData: 'No data.',
};
interface Item {
  id?: number;
}

bootstrap(({ actions, events, parameters: { fields }, ready, utils }: BlockProps): VNode => {
  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = useCallback((d: Item[], err: string): void => {
    if (err) {
      setError(true);
    } else {
      setData(d);
      setError(false);
    }
    setLoading(false);
  }, []);

  const onClick = useCallback(
    (d: Item): void => {
      if (actions.onClick) {
        actions.onClick.dispatch(d);
      }
    },
    [actions],
  );

  const onClickCell = useCallback(
    (event: Event, field: Field, item: Item): void => {
      if (field.onClick === undefined) {
        return;
      }

      // Prevent row click event from happening
      event.stopPropagation();
      actions[field.onClick].dispatch(item);
    },
    [actions],
  );

  useEffect(() => {
    events.on.data(loadData);
    ready();
  }, [events, loadData, ready, utils]);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <FormattedMessage id="error" />;
  }

  if (!data.length) {
    return <FormattedMessage id="noData" />;
  }

  return (
    <table className="table is-hoverable is-striped is-fullwidth" role="grid">
      <thead>
        <tr>
          {fields.map(field => (
            <th key={`header.${field.name}`}>{field.label ?? field.name}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, dataIndex) => (
          <tr
            key={item.id || dataIndex}
            className={actions.onClick.type !== 'noop' ? styles.clickable : undefined}
            onClick={() => onClick(item)}
          >
            {fields.map(field => {
              const value = remapData(field.name, item);
              return (
                <td
                  key={field.name}
                  onClick={event => onClickCell(event, field, item)}
                  role="gridcell"
                >
                  {typeof value === 'string' ? value : JSON.stringify(value)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}, messages);
