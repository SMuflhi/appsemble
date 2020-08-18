import type { Action } from '@appsemble/sdk';
import { ComponentChildren, h, VNode } from 'preact';

import styles from './index.css';

export interface CardProps {
  onAvatarClick: (event: Event) => void;
  action: Action;
  children: ComponentChildren;
}

export function AvatarWrapper({ action, children, onAvatarClick }: CardProps): VNode {
  return action.type === 'link' ? (
    <a
      className={`media-left px-0 py-0 ${styles.avatar}`}
      href={action.href()}
      onClick={onAvatarClick}
    >
      {children}
    </a>
  ) : (
    <button
      className={`media-left px-0 py-0 ${styles.avatar}`}
      onClick={onAvatarClick}
      type="button"
    >
      {children}
    </button>
  );
}
