import { Button, Loader, Message, Table, useData, useToggle } from '@appsemble/react-components';
import { OrganizationInvite } from '@appsemble/types';
import { Permission } from '@appsemble/utils';
import { ReactElement, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';

import { HeaderControl } from '../../../../components/HeaderControl';
import { useUser } from '../../../../components/UserProvider';
import { Member } from '../../../../types';
import { checkRole } from '../../../../utils/checkRole';
import { AddMembersModal } from '../AddMembersModal';
import { InviteRow } from '../InviteRow';
import { MemberRow } from '../MemberRow';
import styles from './index.module.css';
import { messages } from './messages';

export function MemberTable(): ReactElement {
  const { organizationId } = useParams<{ organizationId: string }>();
  const { userInfo } = useUser();

  const {
    data: members,
    error: membersError,
    loading: membersLoading,
    setData: setMembers,
  } = useData<Member[]>(`/api/organizations/${organizationId}/members`);
  const {
    data: invites,
    error: invitesError,
    loading: invitesLoading,
    setData: setInvites,
  } = useData<OrganizationInvite[]>(`/api/organizations/${organizationId}/invites`);
  const addMembersModal = useToggle();

  const onInvited = useCallback(
    (newInvites: OrganizationInvite[]) => setInvites([...invites, ...newInvites]),
    [invites, setInvites],
  );

  const onMemberChanged = useCallback(
    (member: Member) => setMembers(members.map((m) => (m.id === member.id ? member : m))),
    [members, setMembers],
  );

  const onMemberDeleted = useCallback(
    (member: Member) => setMembers(members.filter((m) => m.id !== member.id)),
    [members, setMembers],
  );

  const onInviteDeleted = useCallback(
    (invite: OrganizationInvite) => setInvites(invites.filter((i) => i.email !== invite.email)),
    [invites, setInvites],
  );

  const me = members?.find((member) => member.id === userInfo.sub);
  const ownerCount = me && members.filter((member) => member.role === 'Owner').length;
  const mayEdit = me && checkRole(me.role, Permission.ManageMembers);
  const mayInvite = me && checkRole(me.role, Permission.InviteMember);

  return (
    <>
      <HeaderControl
        control={
          <Button onClick={addMembersModal.enable}>
            <FormattedMessage {...messages.addMembers} />
          </Button>
        }
        level={4}
      >
        <FormattedMessage {...messages.members} />
      </HeaderControl>
      {membersLoading || invitesLoading ? (
        <Loader />
      ) : membersError || invitesError ? (
        <Message color="danger">
          <FormattedMessage {...messages.membersError} />
        </Message>
      ) : (
        <Table className={styles.table}>
          <thead>
            <tr>
              <th>
                <FormattedMessage {...messages.name} />
              </th>
              <th align="right">
                <FormattedMessage {...messages.actions} />
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <MemberRow
                key={member.id}
                mayEdit={mayEdit}
                member={member}
                onChanged={onMemberChanged}
                onDeleted={onMemberDeleted}
                ownerCount={ownerCount}
              />
            ))}
            {invites.map((invite) => (
              <InviteRow
                invite={invite}
                key={invite.email}
                mayInvite={mayInvite}
                onDeleted={onInviteDeleted}
              />
            ))}
          </tbody>
        </Table>
      )}
      <AddMembersModal onInvited={onInvited} state={addMembersModal} />
    </>
  );
}
