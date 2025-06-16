import { DocDates } from './general.interface';
import { Organization } from './organization.interface';
import { Role } from './role.interface';

export interface UserBase {
  email: string;
  firstName: string;
  lastName: string;
  image: string;
  auth0Sub: string | null;
}

export interface User extends UserBase, DocDates {
  id: string;
  password: string;
  orgs: Organization[];
  blocked: boolean;
  verified: boolean;
  roles: { role: Role }[];
}

export interface UserSignupRequest extends UserBase {
  org: string;
  password: string;
}

export interface UserRequest extends UserBase {
  roleId: string;
  orgId: string;
  password: string;
  newPassword?: string;
}

export interface InviteRequest {
  email: string;
  role: string;
}
export type UpdateMembersRequestType = 'modify' | 'set';
type ModifyMembers = { type: 'modify'; add?: string[]; remove?: string[] };
type SetMembers = { type: 'set'; set: string[] };
export type UpdateMembersRequest = ModifyMembers | SetMembers;

export interface UserDetails {
  role: { label: string; id: string; permissions: string[] };
  userId: string;
  org: { id: string; name: string };
  family_name: string;
  given_name: string;
  nickname: string;
  name: string;
  picture: string;
  updated_at: string;
  email: string;
  email_verified: string;
  sub: string;
}

