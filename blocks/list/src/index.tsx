import { bootstrap, FormattedMessage } from '@appsemble/preact';
import { Loader, Message } from '@appsemble/preact-components';
import { h } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

import type { Item } from '../block';
import { ListItem } from './components/ListItem';

const messages = {
  error: 'An error occurred when fetching the data.',
  noData: 'There is no data available.',
};

bootstrap(({ data: blockData, events, parameters: { base }, ready, utils }) => {
  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (blockData != null) {
      const newData = base == null ? blockData : blockData[base];

      if (Array.isArray(newData)) {
        setData(newData);
        setLoading(false);
      }
    }
  }, [base, blockData]);

  const loadData = useCallback(
    (d: any, err: string): void => {
      if (err) {
        setError(true);
      } else {
        if (base == null) {
          setData(d);
        } else {
          setData(d[base]);
        }
        setError(false);
      }
      setLoading(false);
    },
    [base],
  );

  useEffect(() => {
    events.on.data(loadData);
    ready();
  }, [events, loadData, ready, utils]);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <Message className="mt-4 mr-6 mb-4 ml-5" color="danger">
        <FormattedMessage id="error" />
      </Message>
    );
  }

  if (!data.length) {
    return (
      <Message className="mt-4 mr-6 mb-4 ml-5">
        <FormattedMessage id="noData" />
      </Message>
    );
  }

  return (
    <ul className="py-4 px-5">
      {data.map((item, index) => (
        <li key={item.id ?? index}>
          <ListItem item={item} />
        </li>
      ))}
    </ul>
  );
}, messages);
