import { Portal, SideMenuButton } from '@appsemble/react-components';
import { ReactChild, ReactElement } from 'react';

import { shouldShowMenu } from '../../utils/layout';
import { useAppDefinition } from '../AppDefinitionProvider';
import { usePage } from '../MenuProvider';
import { ProfileDropdown } from '../ProfileDropdown';
import { useUser } from '../UserProvider';

interface TitleBarProps {
  children?: ReactChild;
}

/**
 * The title bar on the top of the page.
 *
 * This displays the app name,
 */
export function TitleBar({ children }: TitleBarProps): ReactElement {
  const { definition } = useAppDefinition();
  const { role, teams } = useUser();
  const { page } = usePage();

  const navigation = (page?.navigation || definition?.layout?.navigation) ?? 'left-menu';

  return (
    <Portal element={document.getElementsByClassName('navbar')[0]}>
      <div className="is-flex is-justify-content-space-between is-flex-grow-1">
        {navigation === 'left-menu' && shouldShowMenu(definition, role, teams) && (
          <div className="navbar-brand">
            <span>
              <SideMenuButton />
            </span>
          </div>
        )}
        <div className="navbar-brand is-flex-grow-1">
          <h2 className="navbar-item title is-4">{children || definition.name}</h2>
        </div>
        {(definition.layout?.login == null || definition.layout?.login === 'navbar') && (
          <div className="navbar-end is-flex is-align-items-stretch is-justify-content-flex-end ml-auto">
            <ProfileDropdown />
          </div>
        )}
      </div>
    </Portal>
  );
}
