import { permissions, StyleValidationError, validateStyle } from '@appsemble/utils';
import Boom from '@hapi/boom';
import crypto from 'crypto';
import { Op, UniqueConstraintError } from 'sequelize';

import {
  BlockVersion,
  EmailAuthorization,
  Organization,
  OrganizationBlockStyle,
  OrganizationInvite,
  User,
} from '../models';
import type { KoaContext } from '../types';
import checkRole from '../utils/checkRole';

interface Params {
  blockId: string;
  blockOrganizationId: string;
  memberId: string;
  organizationId: string;
  token: string;
}

export async function getOrganization(ctx: KoaContext<Params>): Promise<void> {
  const { organizationId } = ctx.params;

  const organization = await Organization.findByPk(organizationId);
  if (!organization) {
    throw Boom.notFound('Organization not found.');
  }

  ctx.body = {
    id: organization.id,
    name: organization.name,
  };
}

export async function createOrganization(ctx: KoaContext): Promise<void> {
  const { id, name } = ctx.request.body;
  const {
    user: { id: userId },
  } = ctx.state;

  const user = await User.findOne({
    attributes: ['primaryEmail', 'name'],
    include: [
      {
        required: false,
        model: EmailAuthorization,
        attributes: ['verified'],
        where: {
          email: { [Op.col]: 'User.primaryEmail' },
        },
      },
    ],
    where: { id: userId },
  });

  if (!user.primaryEmail || !user.EmailAuthorizations[0].verified) {
    throw Boom.forbidden('Email not verified.');
  }

  try {
    const organization = await Organization.create({ id, name }, { include: [User] });

    // @ts-ignore
    await organization.addUser(userId, { through: { role: 'Owner' } });
    await organization.reload();

    ctx.body = {
      id: organization.id,
      name: organization.name,
      members: organization.Users.map((u) => ({
        id: u.id,
        name: u.name,
        primaryEmail: u.primaryEmail,
        role: 'Owner',
      })),
      invites: [],
    };
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw Boom.conflict(`Another organization with the name “${name}” already exists`);
    }

    throw error;
  }
}

export async function getMembers(ctx: KoaContext<Params>): Promise<void> {
  const { organizationId } = ctx.params;

  const organization = await Organization.findByPk(organizationId, {
    include: [User],
  });
  if (!organization) {
    throw Boom.notFound('Organization not found.');
  }

  ctx.body = organization.Users.map((user) => ({
    id: user.id,
    name: user.name,
    primaryEmail: user.primaryEmail,
    role: user.Member.role,
  }));
}

export async function getInvites(ctx: KoaContext<Params>): Promise<void> {
  const { organizationId } = ctx.params;

  const organization = await Organization.findByPk(organizationId, {
    include: [OrganizationInvite],
  });
  if (!organization) {
    throw Boom.notFound('Organization not found.');
  }

  ctx.body = organization.OrganizationInvites.map((invite) => ({
    email: invite.email,
  }));
}

export async function getInvitation(ctx: KoaContext<Params>): Promise<void> {
  const { token } = ctx.params;

  const invite = await OrganizationInvite.findOne({
    where: { key: token },
  });

  if (!invite) {
    throw Boom.notFound('This token does not exist.');
  }

  const organization = await Organization.findByPk(invite.OrganizationId, { raw: true });

  ctx.body = { organization: { id: organization.id, name: organization.name } };
}

export async function respondInvitation(ctx: KoaContext<Params>): Promise<void> {
  const { organizationId } = ctx.params;
  const { response, token } = ctx.request.body;
  const {
    user: { id: userId },
  } = ctx.state;

  const invite = await OrganizationInvite.findOne({ where: { key: token } });

  if (!invite) {
    throw Boom.notFound('This token is invalid.');
  }

  const organization = await Organization.findByPk(invite.OrganizationId);

  if (organizationId !== organization.id) {
    throw Boom.notAcceptable('Organization IDs does not match');
  }

  if (response) {
    await organization.addUser(userId);
  }

  await invite.destroy();
}

export async function inviteMember(ctx: KoaContext<Params>): Promise<void> {
  const { mailer } = ctx;
  const { organizationId } = ctx.params;
  const { email } = ctx.request.body;
  const { user } = ctx.state;

  const organization = await Organization.findByPk(organizationId, { include: [User] });
  if (!organization) {
    throw Boom.notFound('Organization not found.');
  }

  const dbEmail = await EmailAuthorization.findByPk(email, { include: [User] });
  const invitedUser = dbEmail ? dbEmail.User : null;

  if (!(await organization.hasUser(user.id))) {
    throw Boom.forbidden('Not allowed to invite users to organizations you are not a member of.');
  }

  await checkRole(ctx, organization.id, permissions.ManageMembers);

  if (invitedUser && (await organization.hasUser(invitedUser))) {
    throw Boom.conflict('User is already in this organization or has already been invited.');
  }

  const key = crypto.randomBytes(20).toString('hex');
  await OrganizationInvite.create({
    OrganizationId: organization.id,
    UserId: invitedUser ? invitedUser.id : null,
    key,
    email,
  });

  await mailer.sendEmail(
    { email, ...(invitedUser && { name: invitedUser.name }) },
    'organizationInvite',
    {
      organization: organization.id,
      url: `${ctx.origin}/organization-invite?token=${key}`,
    },
  );

  ctx.body = {
    id: invitedUser ? invitedUser.id : null,
    name: invitedUser ? invitedUser.name : null,
    primaryEmail: invitedUser ? invitedUser.primaryEmail : email,
  };
}

export async function resendInvitation(ctx: KoaContext<Params>): Promise<void> {
  const { mailer } = ctx;
  const { organizationId } = ctx.params;
  const { email } = ctx.request.body;

  const organization = await Organization.findByPk(organizationId, {
    include: [OrganizationInvite],
  });
  if (!organization) {
    throw Boom.notFound('Organization not found.');
  }

  await checkRole(ctx, organization.id, permissions.ManageMembers);

  const invite = await organization.OrganizationInvites.find((i) => i.email === email);
  if (!invite) {
    throw Boom.notFound('This person was not invited previously.');
  }

  const user = await invite.getUser();

  await mailer.sendEmail({ email, ...(user && { name: user.name }) }, 'organizationInvite', {
    organization: organization.id,
    url: `${ctx.origin}/organization-invite?token=${invite.key}`,
  });

  ctx.body = 204;
}

export async function removeInvite(ctx: KoaContext): Promise<void> {
  const { email } = ctx.request.body;

  const invite = await OrganizationInvite.findOne({ where: { email } });
  if (!invite) {
    throw Boom.notFound('This invite does not exist.');
  }

  await checkRole(ctx, invite.OrganizationId, permissions.ManageMembers);

  await invite.destroy();
}

export async function removeMember(ctx: KoaContext<Params>): Promise<void> {
  const { memberId, organizationId } = ctx.params;
  const { user } = ctx.state;

  const organization = await Organization.findByPk(organizationId, { include: [User] });
  if (!organization.Users.some((u) => u.id === user.id)) {
    throw Boom.notFound('User is not part of this organization.');
  }

  if (!organization.Users.some((u) => u.id === memberId)) {
    throw Boom.notFound('This member is not part of this organization.');
  }

  await checkRole(ctx, organization.id, permissions.ManageMembers);

  if (memberId === user.id && organization.Users.length <= 1) {
    throw Boom.notAcceptable(
      'Not allowed to remove yourself from an organization if you’re the only member left.',
    );
  }

  await organization.removeUser(memberId);
}

export async function setRole(ctx: KoaContext<Params>): Promise<void> {
  const { memberId, organizationId } = ctx.params;
  const { role } = ctx.request.body;
  const { user } = ctx.state;

  const organization = await Organization.findByPk(organizationId, { include: [User] });
  if (!organization.Users.some((u) => u.id === user.id)) {
    throw Boom.notFound('User is not part of this organization.');
  }

  if (user.id === memberId) {
    throw Boom.badRequest('Not allowed to change your own rule.');
  }

  await checkRole(ctx, organization.id, permissions.ManageRoles);

  const member = organization.Users.find((m) => m.id === memberId);
  if (!member) {
    throw Boom.notFound('This member is not part of this organization.');
  }

  await member.Member.update({ role });
  ctx.body = {
    id: member.id,
    role,
    name: member.name,
    primaryEmail: member.primaryEmail,
  };
}

export async function getOrganizationCoreStyle(ctx: KoaContext<Params>): Promise<void> {
  const { organizationId } = ctx.params;
  const organization = await Organization.findByPk(organizationId, { raw: true });

  if (!organization) {
    throw Boom.notFound('Organization not found.');
  }

  ctx.body = organization.coreStyle || '';
  ctx.type = 'css';
  ctx.status = 200;
}

export async function setOrganizationCoreStyle(ctx: KoaContext<Params>): Promise<void> {
  const { organizationId } = ctx.params;
  const { style } = ctx.request.body;
  const css = style.toString().trim();

  try {
    validateStyle(css);

    const organization = await Organization.findByPk(organizationId);
    if (!organization) {
      throw Boom.notFound('Organization not found.');
    }

    await checkRole(ctx, organization.id, permissions.EditThemes);

    organization.coreStyle = css.length ? css.toString() : null;
    await organization.save();
  } catch (e) {
    if (e instanceof StyleValidationError) {
      throw Boom.badRequest('Provided CSS was invalid.');
    }

    throw e;
  }
}

export async function getOrganizationSharedStyle(ctx: KoaContext<Params>): Promise<void> {
  const { organizationId } = ctx.params;
  const organization = await Organization.findByPk(organizationId, { raw: true });

  if (!organization) {
    throw Boom.notFound('Organization not found.');
  }

  ctx.body = organization.sharedStyle || '';
  ctx.type = 'css';
  ctx.status = 200;
}

export async function setOrganizationSharedStyle(ctx: KoaContext<Params>): Promise<void> {
  const { organizationId } = ctx.params;
  const { style } = ctx.request.body;
  const css = style.toString().trim();

  try {
    validateStyle(css);

    const organization = await Organization.findByPk(organizationId);
    if (!organization) {
      throw Boom.notFound('Organization not found.');
    }

    await checkRole(ctx, organization.id, permissions.EditThemes);

    organization.sharedStyle = css.length ? css.toString() : null;
    await organization.save();
  } catch (e) {
    if (e instanceof StyleValidationError) {
      throw Boom.badRequest('Provided CSS was invalid.');
    }

    throw e;
  }
}

export async function getOrganizationBlockStyle(ctx: KoaContext<Params>): Promise<void> {
  const { blockId, blockOrganizationId, organizationId } = ctx.params;

  const blockStyle = await OrganizationBlockStyle.findOne({
    where: {
      OrganizationId: organizationId,
      block: `@${blockOrganizationId}/${blockId}`,
    },
  });

  ctx.body = blockStyle?.style ? blockStyle.style : '';
  ctx.type = 'css';
  ctx.status = 200;
}

export async function setOrganizationBlockStyle(ctx: KoaContext<Params>): Promise<void> {
  const { blockId, blockOrganizationId, organizationId } = ctx.params;
  const { style } = ctx.request.body;
  const css = style.toString().trim();

  try {
    validateStyle(css);

    const organization = await Organization.findByPk(organizationId);
    if (!organization) {
      throw Boom.notFound('Organization not found.');
    }

    await checkRole(ctx, organization.id, permissions.EditThemes);

    const block = await BlockVersion.findOne({
      where: { name: blockId, OrganizationId: blockOrganizationId },
    });
    if (!block) {
      throw Boom.notFound('Block not found.');
    }

    await OrganizationBlockStyle.upsert({
      style: css.length ? css.toString() : null,
      OrganizationId: organization.id,
      block: `@${block.OrganizationId}/${block.name}`,
    });
  } catch (e) {
    if (e instanceof StyleValidationError) {
      throw Boom.badRequest('Provided CSS was invalid.');
    }

    throw e;
  }
}
