import { AsyncButton, AsyncSelect, useConfirmation } from '@appsemble/react-components/src';
import { TeamRole } from '@appsemble/utils/src';
import { TeamMember } from 'packages/studio/src/types';
import React, { ReactElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { messages } from './messages';

interface TeamMemberRowProps {
  member: TeamMember;
  mayInvite: boolean;
  onEdit: (member: TeamMember, role: TeamRole) => Promise<void>;
  onRemove: (member: TeamMember) => Promise<void>;
}

export function TeamMemberRow({
  mayInvite,
  member,
  onEdit,
  onRemove,
}: TeamMemberRowProps): ReactElement {
  const editRole = useCallback((event, role) => onEdit(member, role), [member, onEdit]);
  const removeMember = useCallback(() => onRemove(member), [member, onRemove]);
  const { formatMessage } = useIntl();

  const remove = useConfirmation({
    title: <FormattedMessage {...messages.removingMember} />,
    body: <FormattedMessage {...messages.removeWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancelLabel} />,
    confirmLabel: <FormattedMessage {...messages.removeMember} />,
    action: removeMember,
  });

  return (
    <tr key={member.id}>
      <td>{member.name || member.primaryEmail || member.id}</td>
      <td align="right">
        {mayInvite ? (
          <AsyncSelect name="role" onChange={editRole} value={member.role}>
            {Object.values(TeamRole).map((role) => (
              <option key={role} value={role}>
                {formatMessage(messages[role])}
              </option>
            ))}
          </AsyncSelect>
        ) : (
          <FormattedMessage {...messages[member.role]} />
        )}
        {mayInvite && (
          <AsyncButton
            className="ml-2"
            color="danger"
            icon="trash-alt"
            onClick={remove}
            title={formatMessage(messages.removeMember)}
          />
        )}
      </td>
    </tr>
  );
}
