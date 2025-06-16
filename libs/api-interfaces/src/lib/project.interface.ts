import { Board } from './board.interface';
import { DocDates } from './general.interface';
import { Organization } from './organization.interface';
import { User } from './user.interface';

export interface ProjectBase {
  name: string;
  slug: string;
  description: string;
}
export interface Project extends ProjectBase, DocDates {
  id: string;
  org: Organization;
  boards: Board[];
  createdBy: User;
  members: User[];
}

export interface ProjectRequest extends ProjectBase {
  orgId: string;
  createdById?: string;
  members?: string[];
}

