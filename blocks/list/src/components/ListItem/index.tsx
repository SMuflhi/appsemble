import { useBlock } from '@appsemble/preact';
import { Icon } from '@appsemble/preact-components';
import { h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import type { Item } from '../../../block';
import ListItemWrapper from '../ListItemWrapper';
import styles from './index.css';

interface ListItemProps {
  item: Item;
}

export default function ListItem({ item }: ListItemProps): VNode {
  const {
    actions,
    parameters: { fields, header, icon },
    utils: { remap },
  } = useBlock();

  const onItemClick = useCallback(
    (event: Event) => {
      event.preventDefault();
      actions.onClick.dispatch(item);
    },
    [actions, item],
  );

  const headerValue = remap(header, item);

  return (
    <ListItemWrapper actions={actions} className={styles.item} item={item} onClick={onItemClick}>
      {(icon || headerValue) && (
        <div className={styles.header}>
          {icon && <Icon icon={icon} />}
          {headerValue && <h4>{headerValue}</h4>}
        </div>
      )}
      {fields.map((field) => {
        let value;

        if (field.value) {
          value = remap(field.value, item);
        }

        return (
          <span className={styles.itemField}>
            {field.icon && <Icon icon={field.icon} />}
            {field.label && (
              <span>
                {field.label}
                {value && ': '}
              </span>
            )}
            {value && (
              <strong className="has-text-bold">
                {typeof value === 'string' ? value : JSON.stringify(value)}
              </strong>
            )}
          </span>
        );
      })}
      {actions.onClick.type !== 'noop' && (
        <Icon className={styles.button} icon="angle-right" size="large" />
      )}
    </ListItemWrapper>
  );
}
