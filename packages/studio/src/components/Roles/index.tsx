import { Loader, useMessages } from '@appsemble/react-components';
import axios from 'axios';
import classNames from 'classnames';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import useUser from '../../hooks/useUser';
import { useApp } from '../AppContext';
import HelmetIntl from '../HelmetIntl';
import styles from './index.css';
import messages from './messages';

export interface Member {
  id: number;
  name?: string;
  primaryEmail?: string;
  role: string;
}

export default function Roles(): React.ReactElement {
  const intl = useIntl();
  const push = useMessages();
  const { userInfo } = useUser();
  const { app } = useApp();
  const [members, setMembers] = React.useState<Member[]>();
  const [submittingMemberRoleId, setSubmittingMemberRoleId] = React.useState<number>();

  React.useEffect(() => {
    const getMembers = async (): Promise<void> => {
      const { data: appMembers } = await axios.get<Member[]>(`/api/apps/${app.id}/members`);
      if (app.definition.security.default.policy === 'invite') {
        setMembers(appMembers);
        return;
      }

      const { data: organizationMembers } = await axios.get<Member[]>(
        `/api/organizations/${app.OrganizationId}/members`,
      );

      setMembers([
        ...organizationMembers.map((orgMem) => {
          const appMember = appMembers.find((appMem) => appMem.id === orgMem.id);
          return appMember || { ...orgMem, role: app.definition.security.default.role };
        }),
        ...appMembers.filter(
          (appMem) => !organizationMembers.find((orgMem) => orgMem.id === appMem.id),
        ),
      ]);
    };
    getMembers();
  }, [app]);
  const onChangeRole = async (
    event: React.ChangeEvent<HTMLSelectElement>,
    userId: number,
  ): Promise<void> => {
    event.preventDefault();
    const { value: role } = event.target;

    setSubmittingMemberRoleId(userId);

    try {
      const { data: member } = await axios.post<Member>(`/api/apps/${app.id}/members/${userId}`, {
        role,
      });

      push({
        color: 'success',
        body: intl.formatMessage(messages.changeRoleSuccess, {
          name: member.name || member.primaryEmail || member.id,
          role,
        }),
      });
    } catch (error) {
      push({ body: intl.formatMessage(messages.changeRoleError) });
    }

    setSubmittingMemberRoleId(undefined);
  };

  if (members === undefined) {
    return <Loader />;
  }

  return (
    <div className="content">
      <HelmetIntl title={messages.title} />
      <h3>
        <FormattedMessage {...messages.members} />
      </h3>
      <table className="table is-hoverable is-striped">
        <thead>
          <tr>
            <th>
              <FormattedMessage {...messages.member} />
            </th>
            <th className="has-text-right">
              <FormattedMessage {...messages.role} />
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td>
                <span>{member.name || member.primaryEmail || member.id}</span>{' '}
                <div className={`tags ${styles.tags}`}>
                  {member.id === userInfo.sub && (
                    <span className="tag is-success">
                      <FormattedMessage {...messages.you} />
                    </span>
                  )}
                </div>
              </td>
              <td className="has-text-right">
                <div className="control is-inline">
                  <div
                    className={classNames('select', {
                      'is-loading': submittingMemberRoleId === member.id,
                    })}
                  >
                    <select
                      defaultValue={member.role}
                      disabled={submittingMemberRoleId === member.id}
                      onChange={(event) => onChangeRole(event, member.id)}
                    >
                      {Object.keys(app.definition.security.roles).map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
