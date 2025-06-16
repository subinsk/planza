import { Role, UserPayload } from '@planza/api-interfaces';
import { InternalServerErrorException } from '@nestjs/common';

export const getUserDetails = (
  user: UserPayload | null,
): { role: Role; org: { id: string; name: string }; projects: string[]; userId: string; email } => {
  if (user) {
    console.log('getUserDetails - received user payload:', JSON.stringify(user, null, 2));
    
    // Try different possible namespaces
    const possibleNamespaces = [
      'https://planza.app/',
      'https://planza.app',
      'https://dev-gzv9qjr6.us.auth0.com/',
      'https://dev-gzv9qjr6.us.auth0.com',
      '' // Direct claims without namespace
    ];
    
    let role, projects, org, email, userId;
    
    // Try to find claims with different namespaces
    for (const namespace of possibleNamespaces) {
      const roleKey = namespace ? `${namespace}role` : 'role';
      const projectsKey = namespace ? `${namespace}projects` : 'projects';
      const orgKey = namespace ? `${namespace}org` : 'org';
      const emailKey = namespace ? `${namespace}email` : 'email';
      const userIdKey = namespace ? `${namespace}userId` : 'userId';
      
      console.log(`Checking namespace: "${namespace}"`);
      console.log(`Looking for keys: ${roleKey}, ${projectsKey}, ${orgKey}, ${emailKey}, ${userIdKey}`);
      
      if (user[roleKey] !== undefined) {
        role = user[roleKey];
        projects = user[projectsKey];
        org = user[orgKey];
        email = user[emailKey];
        userId = user[userIdKey];
        
        console.log(`Found claims with namespace "${namespace}":`, {
          role, projects, org, email, userId
        });
        break;
      }
    }
    
    // If we didn't find the expected claims, try common Auth0 claims
    if (!userId) {
      userId = user['sub'] || user['https://planza.app/userId'] || user['user_id'];
    }
    
    // Try to get email from multiple sources
    if (!email) {
      email = user['email'] || // Standard email claim
              user['https://planza.app/email'] || // Namespaced email claim
              user['email_verified'] && user['email']; // Check if email is verified
      console.log('Email extraction attempts:', {
        standardEmail: user['email'],
        namespacedEmail: user['https://planza.app/email'],
        emailVerified: user['email_verified']
      });
    }
    
    console.log('Fallback - using standard claims:', { userId, email });
    
    // TEMPORARY: Provide default values if missing for local development
    if (!role) {
      console.log('No role found - providing default role for local development');
      role = {
        name: 'user',
        permissions: ['user.read', 'user.update', 'task.read', 'task.create', 'task.update', 'project.read', 'board.read', 'org.read']
      } as Role;
    }
    
    if (!org) {
      console.log('No org found - providing default org for local development');
      org = {
        id: 'default-org-id',
        name: 'Default Organization'
      };
    }
    
    if (!projects) {
      projects = [];
    }
    
    if (userId != null) {
      console.log('Successfully extracted user details:', {
        userId,
        email,
        hasRole: !!role,
        hasOrg: !!org
      });
      return { role: role as Role, org, email, projects, userId };
    }
    
    console.log('No valid user details found in payload');
  }
  throw new InternalServerErrorException('User data not found');
};


