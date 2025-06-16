import { Role, UserPayload } from '@planza/api-interfaces';
import { InternalServerErrorException } from '@nestjs/common';

export const getUserDetails = (
  user: UserPayload | null,
): { role: Role; org: { id: string; name: string }; projects: string[]; userId: string; email } => {
  if (user) {
    const {
      'https://planza.app/role': role,
      'https://planza.app/projects': projects,
      'https://planza.app/org': org,
      'https://planza.app/email': email,
      'https://planza.app/userId': userId,
    } = user;
    return { role: role as Role, org, email, projects, userId };
  }
  throw new InternalServerErrorException('User data not found');
};


