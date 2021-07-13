import { IconName } from '@fortawesome/fontawesome-common-types';
import { ReactElement, ReactNode } from 'react';

import { Icon, NavLink } from '..';
import styles from './index.module.css';

interface SideNavLinkProps {
  /**
   * If true, only highlight on an exact match.
   */
  exact?: boolean;

  /**
   * Child navigation items to render.
   */
  children?: ReactNode;

  /**
   * The icon to render.
   */
  icon?: IconName;

  /**
   * Where to navigate to.
   */
  to: string;
}

/**
 * Render a Bulma menu item styled navigation link.
 *
 * https://bulma.io/documentation/components/menu
 */
export function MenuItem({ children, exact, icon, to }: SideNavLinkProps): ReactElement {
  return (
    <NavLink className={`is-flex is-align-items-center ${styles.root}`} exact={exact} to={to}>
      {icon && <Icon className={`mr-1 ${styles.middle}`} icon={icon} size="medium" />}
      <span className={styles.text}>{children}</span>
    </NavLink>
  );
}
