import { ModalCard } from '@appsemble/react-components';
import classNames from 'classnames';
import { ComponentPropsWithoutRef, ReactElement } from 'react';

import { ShowDialogParams } from '../../types';
import { BlockList } from '../BlockList';
import styles from './index.module.css';

interface PageDialogProps
  extends Omit<ComponentPropsWithoutRef<typeof BlockList>, 'blocks' | 'prefix'> {
  dialog: ShowDialogParams;
}

/**
 * The dialog component to render on a page when the `dialog` action is dispatched.
 */
export function PageDialog({ dialog = null, ...props }: PageDialogProps): ReactElement {
  return (
    <ModalCard
      cardClassName={classNames({ [styles.fullscreen]: dialog?.fullscreen })}
      closable={Boolean(dialog?.closable)}
      isActive={Boolean(dialog)}
      onClose={dialog?.close}
      title={dialog?.title}
    >
      {dialog && (
        <BlockList
          blocks={dialog.blocks}
          data={dialog.data}
          extraCreators={dialog.actionCreators}
          prefix={`${dialog.prefix}.blocks`}
          {...props}
        />
      )}
    </ModalCard>
  );
}
