import { Loader } from '@appsemble/react-components';
import { JwtPayload, Organization, TokenResponse, UserInfo } from '@appsemble/types';
import { setUser } from '@sentry/browser';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import React, {
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Role } from '../../types';

interface UserProviderProps {
  children: ReactNode;
}

/**
 * The representation of an organization that the user is a member of.
 */
export interface UserOrganization extends Organization {
  /**
   * The user’s role within the organization.
   */
  role: Role;
}

interface UserContext {
  login: (tokenResponse: TokenResponse) => void;
  logout: () => void;
  userInfo: UserInfo;
  refreshUserInfo: () => Promise<void>;
  organizations: UserOrganization[];
  setOrganizations: (organizations: UserOrganization[]) => void;
}

const Context = createContext<UserContext>(null);

// The buffer between the access token expiration and the refresh token request. A minute should be
// plenty of time for the refresh token request to finish.
const REFRESH_BUFFER = 60e3;

export function UserProvider({ children }: UserProviderProps): ReactElement {
  const [userInfo, setUserInfo] = useState<UserInfo>();
  const [organizations, setOrganizations] = useState<UserOrganization[]>();
  const [initialized, setInitialized] = useState(false);
  const [tokenResponse, setTokenResponse] = useState<Partial<TokenResponse>>({
    access_token: localStorage.access_token,
    refresh_token: localStorage.refresh_token,
  });

  const setToken = useCallback((response: TokenResponse) => {
    axios.defaults.headers.authorization = `Bearer ${response.access_token}`;
    localStorage.access_token = response.access_token;
    localStorage.refresh_token = response.refresh_token;
    setTokenResponse(response);
  }, []);

  const refreshUserInfo = useCallback(async () => {
    const { data } = await axios.get<UserInfo>('/api/connect/userinfo');
    setUser({ id: data.sub });
    setUserInfo(data);
  }, []);

  const fetchOrganizations = useCallback(async () => {
    const { data } = await axios.get<UserOrganization[]>('/api/user/organizations');
    setOrganizations(data);
  }, []);

  const login = useCallback(
    (response: TokenResponse) => {
      setToken(response);
      refreshUserInfo();
    },
    [refreshUserInfo, setToken],
  );

  const logout = useCallback(() => {
    setUser(null);
    setUserInfo(null);
    setOrganizations([]);
    delete axios.defaults.headers.authorization;
    delete localStorage.access_token;
    delete localStorage.refresh_token;
  }, []);

  const value = useMemo(
    () => ({
      login,
      logout,
      userInfo,
      refreshUserInfo,
      organizations,
      setOrganizations,
    }),
    [login, logout, userInfo, refreshUserInfo, organizations],
  );

  useEffect(() => {
    if (!tokenResponse.access_token || !tokenResponse.refresh_token) {
      logout();
      setInitialized(true);
      return;
    }

    axios.defaults.headers.authorization = `Bearer ${tokenResponse.access_token}`;

    const { exp } = jwtDecode<JwtPayload>(tokenResponse.access_token);
    const timeout = exp * 1e3 - REFRESH_BUFFER - new Date().getTime();
    const timeoutId = setTimeout(async () => {
      try {
        const { data } = await axios.post<TokenResponse>('/api/refresh', {
          refresh_token: tokenResponse.refresh_token,
        });
        setToken(data);
        refreshUserInfo();
      } catch {
        logout();
      }
    }, timeout);

    Promise.all([refreshUserInfo(), fetchOrganizations()]).finally(() => {
      setInitialized(true);
    });

    return () => {
      clearTimeout(timeoutId);
    };
  }, [fetchOrganizations, logout, refreshUserInfo, setToken, tokenResponse]);

  if (!initialized) {
    return <Loader />;
  }

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useUser(): UserContext {
  return useContext(Context);
}
