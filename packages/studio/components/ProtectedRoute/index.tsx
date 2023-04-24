import { useLocationString, useQuery } from '@appsemble/react-components';
import { type Permission } from '@appsemble/utils';
import { type ReactElement } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { type Organization } from '../../types.js';
import { checkRole } from '../../utils/checkRole.js';
import { useUser } from '../UserProvider/index.js';

interface ProtectedRouteProps {
  permission?: Permission;
  organization?: Organization;
}

export function ProtectedRoute({ organization, permission }: ProtectedRouteProps): ReactElement {
  const redirect = useLocationString();
  const { userInfo } = useUser();
  const qs = useQuery();

  if (!userInfo) {
    const search = new URLSearchParams(qs);
    search.set('redirect', redirect);
    return <Navigate to={{ pathname: '/login', search: `?${search}` }} />;
  }

  if (permission && (!organization || !checkRole(organization.role, permission))) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
}
