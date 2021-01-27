import { AppDefinition } from '@appsemble/types';

export function getDefaultPageName(
  isLoggedIn: boolean,
  role: string,
  definition: Pick<AppDefinition, 'defaultPage' | 'security'>,
): string {
  if (!isLoggedIn) {
    return definition.defaultPage;
  }

  let defaultPage = definition.security.roles[role]?.defaultPage;

  if (!defaultPage) {
    const inheritedRole = definition.security.roles[role].inherits?.find(
      (r) => definition.security.roles[r].defaultPage,
    );

    defaultPage = definition.security.roles[inheritedRole]?.defaultPage;
  }

  return defaultPage || definition.defaultPage;
}
