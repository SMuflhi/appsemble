import { Icon } from '@appsemble/react-components';
import type { PageDefinition } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import React, { ReactElement } from 'react';
import { NavLink, useRouteMatch } from 'react-router-dom';

import { SideMenu } from '../SideMenu';
import styles from './index.css';

interface SideNavigationProps {
  pages: PageDefinition[];
}

/**
 * The app navigation that is displayed in the side menu.
 */
export function SideNavigation({ pages }: SideNavigationProps): ReactElement {
  const route = useRouteMatch();

  return (
    <SideMenu>
      <nav>
        <ul className={`menu-list ${styles.menuList}`}>
          {pages.map((page) => (
            <li key={page.name}>
              <NavLink activeClassName={styles.active} to={`${route.url}/${normalize(page.name)}`}>
                {page.icon ? <Icon className={styles.icon} icon={page.icon} /> : null}
                <span>{page.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </SideMenu>
  );
}
