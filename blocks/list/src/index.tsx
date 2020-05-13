import { bootstrap, FormattedMessage } from '@appsemble/preact';
import { Loader, Message } from '@appsemble/preact-components';
import { h } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

import type { Item } from '../block';
import ListItem from './components/ListItem';
import styles from './index.css';

const messages = {
  error: 'An error occurred when fetching the data.',
  noData: 'There is no data available.',
};

export default bootstrap(
  ({
    actions,
    parameters: { fields = [], header, icon, base },
    data: blockData,
    events,
    ready,
    utils,
  }) => {
    const [data, setData] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
      if (blockData != null) {
        const newData = base != null ? blockData[base] : blockData;

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
          if (base != null) {
            setData(d[base]);
          } else {
            setData(d);
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
        <Message className={styles.message} color="danger">
          <FormattedMessage id="error" />
        </Message>
      );
    }

    if (!data.length) {
      return (
        <Message className={styles.message}>
          <FormattedMessage id="noData" />
        </Message>
      );
    }

    return (
      <ul className={styles.container}>
        {data.map((item, index) => (
          <li key={item.id ?? index}>
            <ListItem item={item} />
          </li>
        ))}
      </ul>
    );
  },
  messages,
);
