import { SideMenuProvider } from '@appsemble/react-components';
import { PageDefinition } from '@appsemble/types';
import { checkAppRole } from '@appsemble/utils';
import { apiUrl, appId } from 'app/src/utils/settings';
import {
  createContext,
  Dispatch,
  ReactElement,
  ReactNode,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react';
import { FormattedMessage } from 'react-intl';

import { useAppDefinition } from '../AppDefinitionProvider';
import { BottomNavigation } from '../BottomNavigation';
import { SideNavigation } from '../SideNavigation';
import { useUser } from '../UserProvider';
import { messages } from './messages';

interface MenuProviderProps {
  children: ReactNode;
}

interface MenuProviderContext {
  page: PageDefinition;
  setPage: Dispatch<SetStateAction<PageDefinition>>;
}

const Context = createContext<MenuProviderContext>(null);

export function usePage(): MenuProviderContext {
  return useContext(Context);
}

export function MenuProvider({ children }: MenuProviderProps): ReactElement {
  const {
    definition: { layout = {}, ...definition },
  } = useAppDefinition();
  const { role, teams } = useUser();
  const [page, setPage] = useState<PageDefinition>();
  const value = useMemo(() => ({ page, setPage }), [page, setPage]);

  const checkPagePermissions = (p: PageDefinition): boolean => {
    const roles = p.roles || definition.roles || [];

    return (
      roles.length === 0 || roles.some((r) => checkAppRole(definition.security, r, role, teams))
    );
  };

  const pages = definition.pages.filter(
    (p) => !p.parameters && !p.hideFromMenu && checkPagePermissions(p),
  );

  if (!pages.length) {
    // Don’t display anything if there are no pages to display.
    return children as ReactElement;
  }

  let navigationElement: ReactElement;
  const navigation = page?.navigation || layout?.navigation;

  switch (navigation) {
    case 'bottom':
      navigationElement = (
        <>
          {children}
          <BottomNavigation pages={pages} />
        </>
      );
      break;
    case 'hidden':
      navigationElement = children as ReactElement;
      break;
    default:
      navigationElement = (
        <SideMenuProvider
          base={<SideNavigation pages={pages} />}
          bottom={
            <div className="py-2 is-flex is-justify-content-center">
              <a
                className="has-text-grey"
                href={`${apiUrl}/apps/${appId}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                <FormattedMessage {...messages.storeLink} />
              </a>
            </div>
          }
        >
          {children}
        </SideMenuProvider>
      );
  }

  return <Context.Provider value={value}>{navigationElement}</Context.Provider>;
}
