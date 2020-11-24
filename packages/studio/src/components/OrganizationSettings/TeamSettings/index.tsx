import {
  Button,
  Loader,
  Modal,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  Table,
  useConfirmation,
  useData,
  useToggle,
} from '@appsemble/react-components';
import { Team } from '@appsemble/types';
import { Permission, TeamRole } from '@appsemble/utils';
import axios from 'axios';
import React, { ReactElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useHistory, useParams } from 'react-router-dom';

import { TeamMember } from '../../../types';
import { checkRole } from '../../../utils/checkRole';
import { AsyncDataView } from '../../AsyncDataView';
import { HeaderControl } from '../../HeaderControl';
import { useUser } from '../../UserProvider';
import { AddTeamMemberModal } from '../AddTeamMemberModal';
import { TeamMemberRow } from '../TeamMemberRow';
import { messages } from './messages';

export function TeamSettings(): ReactElement {
  const { organizationId, teamId } = useParams<{ organizationId: string; teamId: string }>();
  const { organizations, userInfo } = useUser();
  const history = useHistory();
  const { formatMessage } = useIntl();

  const { data: team, loading, setData: setTeam } = useData<Team>(
    `/api/organizations/${organizationId}/teams/${teamId}`,
  );
  const memberResult = useData<TeamMember[]>(
    `/api/organizations/${organizationId}/teams/${teamId}/members`,
  );
  const editModal = useToggle();
  const addModal = useToggle();

  const submitTeam = useCallback(
    async ({ name }: Team) => {
      const { data } = await axios.put<Team>(
        `/api/organizations/${organizationId}/teams/${teamId}`,
        {
          name,
        },
      );
      setTeam(data);
      editModal.disable();
    },
    [editModal, organizationId, setTeam, teamId],
  );

  const onEdit = useCallback(
    async ({ id }: TeamMember, role: TeamRole) => {
      const { data: updated } = await axios.put<TeamMember>(
        `/api/organizations/${organizationId}/teams/${teamId}/members/${id}`,
        { role },
      );
      memberResult.setData((members) =>
        members.map((member) => (member.id === id ? updated : member)),
      );
    },
    [organizationId, memberResult, teamId],
  );

  const onAdd = useCallback(
    async (id: string) => {
      const { data: newMember } = await axios.post<TeamMember>(
        `/api/organizations/${organizationId}/teams/${teamId}/members`,
        { id },
      );
      memberResult.setData((members) => [...members, newMember]);
      addModal.disable();
    },
    [addModal, memberResult, organizationId, teamId],
  );

  const onDelete = useCallback(async () => {
    await axios.delete(`/api/organizations/${organizationId}/teams/${teamId}`);
    history.replace(history.location.pathname.replace(`/teams/${teamId}`, '/teams'));
  }, [history, organizationId, teamId]);

  const onDeleteClick = useConfirmation({
    title: <FormattedMessage {...messages.deletingTeam} />,
    body: <FormattedMessage {...messages.deleteWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancelLabel} />,
    confirmLabel: <FormattedMessage {...messages.deleteTeam} />,
    action: onDelete,
  });

  const onRemoveTeamMember = useCallback(
    async ({ id }: TeamMember) => {
      await axios.delete(`/api/organizations/${organizationId}/teams/${teamId}/members/${id}`);
      memberResult.setData((members) => members.filter((member) => member.id !== id));
    },
    [memberResult, organizationId, teamId],
  );

  if (loading || memberResult.loading) {
    return <Loader />;
  }

  const organization = organizations.find((o) => o.id === organizationId);
  const me = memberResult.data.find((member) => member.id === userInfo.sub);
  const mayEditTeam = organization && checkRole(organization.role, Permission.ManageMembers);
  const mayInvite =
    (me && me.role === TeamRole.Manager) ||
    (organization && checkRole(organization.role, Permission.InviteMember));

  return (
    <>
      <HeaderControl
        control={
          mayEditTeam && (
            <div>
              <Button onClick={editModal.enable}>
                <FormattedMessage {...messages.editButton} />
              </Button>
              <Button
                className="ml-2"
                color="danger"
                icon="trash-alt"
                onClick={onDeleteClick}
                title={formatMessage(messages.deleteTeam)}
              />
            </div>
          )
        }
        level={4}
      >
        {team.name}
      </HeaderControl>

      <HeaderControl
        control={
          mayInvite && (
            <Button onClick={addModal.enable}>
              <FormattedMessage {...messages.addMember} />
            </Button>
          )
        }
        level={5}
      >
        <FormattedMessage {...messages.teamMembers} />
      </HeaderControl>
      <AsyncDataView
        emptyMessage={<FormattedMessage {...messages.noMembers} />}
        errorMessage={<FormattedMessage {...messages.memberError} />}
        loadingMessage={<FormattedMessage {...messages.loadingMembers} />}
        result={memberResult}
      >
        {(members) => (
          <Table>
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
                <TeamMemberRow
                  key={member.id}
                  mayInvite={mayInvite}
                  member={member}
                  onEdit={onEdit}
                  onRemove={onRemoveTeamMember}
                />
              ))}
            </tbody>
          </Table>
        )}
      </AsyncDataView>
      {mayEditTeam && (
        <Modal
          component={SimpleForm}
          defaultValues={team}
          footer={
            <SimpleModalFooter
              cancelLabel={<FormattedMessage {...messages.cancelLabel} />}
              onClose={editModal.disable}
              submitLabel={<FormattedMessage {...messages.editButton} />}
            />
          }
          isActive={editModal.enabled}
          onClose={editModal.disable}
          onSubmit={submitTeam}
          resetOnSuccess
          title={<FormattedMessage {...messages.editingTeam} />}
        >
          <SimpleFormField
            icon="briefcase"
            label={<FormattedMessage {...messages.teamName} />}
            name="name"
            required
          />
        </Modal>
      )}
      {mayInvite && (
        <AddTeamMemberModal onAdd={onAdd} teamMembers={memberResult.data} toggle={addModal} />
      )}
    </>
  );
}
