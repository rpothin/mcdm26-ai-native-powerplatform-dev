/**
 * Resolves the current employee's `systemuserid` from the Power Platform SDK context.
 *
 * The code app runs as the signed-in user, so we match their Azure AD object id (or
 * fall back to their UPN/email) against the `systemusers` table to find the SystemUser
 * row that PoutineSubmission.rpo_submitterid should point at.
 */
import { getContext } from '@microsoft/power-apps/app';
import { listRows } from '../lib/dataverseClient';
import { ENTITY_SETS } from './constants';

export interface CurrentUser {
  systemUserId: string;
  fullName: string;
  userPrincipalName: string;
}

let cachedUser: CurrentUser | undefined;

function escapeODataString(value: string): string {
  return value.replace(/'/g, "''");
}

/** Resolves and caches the current employee's SystemUser row. */
export async function getCurrentUser(): Promise<CurrentUser> {
  if (cachedUser) return cachedUser;

  const ctx = await getContext();
  const { objectId, userPrincipalName, fullName } = ctx.user;

  let rows = objectId
    ? await listRows(ENTITY_SETS.systemUsers, {
        select: ['systemuserid', 'fullname', 'internalemailaddress'],
        filter: `azureactivedirectoryobjectid eq '${escapeODataString(objectId)}'`,
        top: 1,
      })
    : [];

  if (rows.length === 0 && userPrincipalName) {
    rows = await listRows(ENTITY_SETS.systemUsers, {
      select: ['systemuserid', 'fullname', 'internalemailaddress'],
      filter: `internalemailaddress eq '${escapeODataString(userPrincipalName)}'`,
      top: 1,
    });
  }

  const row = rows[0];
  if (!row) {
    throw new Error(
      `Could not find a SystemUser record matching the signed-in account (${userPrincipalName ?? objectId ?? 'unknown'}).`,
    );
  }

  cachedUser = {
    systemUserId: String(row.systemuserid),
    fullName: (row.fullname as string | undefined) ?? fullName ?? 'You',
    userPrincipalName: userPrincipalName ?? '',
  };
  return cachedUser;
}
