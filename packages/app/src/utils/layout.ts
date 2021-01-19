import { AppDefinition } from '@appsemble/types';
import { checkAppRole } from '@appsemble/utils';

export function shouldShowMenu(app: AppDefinition, userRole: string, teams): boolean {
  return app.pages.some((page) => {
    if (page.hideFromMenu) {
      return false;
    }
    if (page.parameters) {
      return false;
    }
    const roles = page.roles || app.roles || [];
    if (!roles.length) {
      return true;
    }
    return roles.some((r) => checkAppRole(app.security, r, userRole, teams));
  });
}
