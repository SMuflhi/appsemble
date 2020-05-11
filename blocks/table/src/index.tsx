import { bootstrap, FormattedMessage } from '@appsemble/preact';
import { Loader } from '@appsemble/preact-components';
import { remapData } from '@appsemble/utils';
import { h } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

import { ItemCell, ItemRow } from './components';
import styles from './index.css';

const messages = {
  error: 'An error occurred when fetching the data.',
  noData: 'No data.',
};
interface Item {
  id?: number;
}

bootstrap(({ actions, events, parameters: { fields }, ready, utils }) => {
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
    (d: any): void => {
      if (actions.onClick) {
        actions.onClick.dispatch(d);
      }
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
      {fields.some((field) => field.label) && (
        <thead>
          <tr>
            {fields.map((field) => (
              <th key={`header.${field.name}`}>{field.label ?? null}</th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {data.map((item, dataIndex) => (
          <ItemRow
            key={item.id || dataIndex}
            className={actions.onClick.type !== 'noop' ? styles.clickable : undefined}
            item={item}
            onClick={onClick}
          >
            {fields.map((field) => {
              const value = remapData(field.name, item);
              return (
                <ItemCell
                  key={field.name}
                  className={onClick ? styles.clickable : undefined}
                  field={field}
                  item={item}
                  onClick={onClick}
                >
                  {typeof value === 'string' ? value : JSON.stringify(value)}
                </ItemCell>
              );
            })}
          </ItemRow>
        ))}
      </tbody>
    </table>
  );
}, messages);
