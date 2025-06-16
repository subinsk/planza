import { RequestParams, Role, Roles, UserPayload, UserRequest, UserSignupRequest } from '@planza/api-interfaces';
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { AppMetadata, AuthenticationClient, ManagementClient, SignUpUserData, UserMetadata } from 'auth0';
import { compareSync, hashSync } from 'bcryptjs';
import * as cuid from 'cuid';
import { JwtPayload, verify, decode } from 'jsonwebtoken';
import { kebabCase } from 'lodash';
import { AuthService } from '../auth/auth.service';
import { PlanzaLoggerService } from '../core/utils/logger.service';
import { getUserDetails } from '../core/utils/payload.util';
import { parseQuery } from '../core/utils/query-parse.util';
import { PrismaService } from '../prisma.service';
import { USER_BASIC_DETAILS } from '../task/task.config';

@Injectable()
export class UserService {
  private readonly managementClient: ManagementClient<AppMetadata, UserMetadata>;
  private readonly authClient: AuthenticationClient;
  private readonly logger = {
    error: (operation: string, message: string, error?: Error | unknown) => {
      this.planzaLogger.getLogger('USER').error(operation, message, error instanceof Error ? error : new Error(String(error)));
    },
    info: (operation: string, message: string, context?: Record<string, unknown>) => {
      this.planzaLogger.getLogger('USER').info(operation, message, context);
    }
  };

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly planzaLogger: PlanzaLoggerService,
  ) {
    this.managementClient = this.auth.management;
    this.authClient = this.auth.auth;
  }

  // Method to update user password in Auth0
  private async updateUserPasswordInAuth0(email: string, password: string): Promise<true | Error> {
    try {
      const user = await this.managementClient.getUsersByEmail(email);
      const connection = this.config.get('AUTH0_DB');
      
      if (!user?.length) {
        this.logger.error('updateUserPasswordInAuth0', 'User not found in Auth0 database');
        return new BadRequestException('User not found');
      }

      const userId = user[0].user_id;
      await this.managementClient.updateUser(
        { id: userId },
        { password, connection }
      );
      
      return true;
    } catch (error) {
      this.logger.error('updateUserPasswordInAuth0', 'Failed to update password in Auth0', error);
      return new InternalServerErrorException();
    }
  }

  async getUserDetails(sessionToken: string) {
    try {
      this.logger.info('getUserDetails', 'Starting to fetch user details');
      const secret = this.config.get('SESSION_TOKEN_SECRET');
      const token: JwtPayload = verify(sessionToken, secret) as any;
      if (!token) {
        this.logger.error('getUserDetails', 'Invalid session token');
        throw new ForbiddenException('Session not valid. Please login again!');
      }
      
      this.logger.info('getUserDetails', 'Token verified, fetching user data', { userId: token.userId });
      
      const [user, userInvite] = await this.prisma.$transaction([
        this.prisma.user.findUnique({
          where: {
            id: token.userId,
          },
          select: {
            email: true,
            orgs: {
              select: {
                id: true,
                name: true,
              },
            },
            projects: {
              select: {
                id: true,
                name: true,
                orgId: true,
              },
            },
            roles: {
              select: {
                orgId: true,
                role: {
                  select: {
                    name: true,
                    label: true,
                    permissions: true,
                  },
                },
              },
            },
          },
        }),
        this.prisma.userInvite.findMany({
          where: {
            email: token.email,
          },
          select: {
            id: true,
          },
        }),
      ]);
      if (!user) {
        this.logger.error('getUserDetails', 'User not found');
        throw new NotFoundException('User not found');
      }
      
      this.logger.info('getUserDetails', 'Found user, processing data', { email: user.email });
      
      const { orgs = [], projects = [], roles = [] } = user;
      const projectIds = projects.map(({ id }) => id);
      const inviteIds = userInvite.map(({ id }) => id);
      
      this.logger.info('getUserDetails', 'Processing user roles and permissions', { 
        orgCount: orgs.length,
        projectCount: projects.length,
        inviteCount: inviteIds.length
      });
      
      const rolesData = roles.reduce((acc, { role, orgId }) => {
        return {
          ...acc,
          [orgId]: role,
        };
      }, {});

      if (token.org) {
        if (orgs.findIndex(({ id }) => id === token.org) < 0) {
          this.logger.error('getUserDetails', 'User is not part of the selected org');
          throw new ForbiddenException('No access to org');
        }
        const projectsPartOfOrg = projects.filter((project) => project?.orgId === token.org).map(({ id }) => id);
        const org = orgs.find(({ id }) => id === token.org);
        return {
          org,
          projects: projectsPartOfOrg,
          role: rolesData[token.org],
        };
      }
      return {
        orgs,
        projects: projectIds,
        invites: inviteIds,
        roles: rolesData,
        partOfMultipleOrgs: orgs.length > 1,
        pendingInvites: inviteIds.length > 0,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('getUserDetails', 'Failed to fetch user details', error);
      throw new InternalServerErrorException('Failed to fetch user details');
    }
  }

  async getOnboardingDetails(sessionToken: string) {
    try {
      const secret = this.config.get('SESSION_TOKEN_SECRET');
      if (!secret) {
        throw new Error('Please provide the Session Token Secret');
      }
      const token: JwtPayload = verify(sessionToken, secret) as JwtPayload;
      if (!token) {
        throw new ForbiddenException('Session not valid. Please login again!');
      }
      const [user, userInvite] = await this.prisma.$transaction([
        this.prisma.user.findUnique({
          where: {
            id: token.userId,
          },
          select: {
            ...USER_BASIC_DETAILS,
            orgs: {
              select: {
                id: true,
                name: true,
                createdBy: {
                  select: {
                    firstName: true,
                    lastName: true,
                    image: true,
                    email: true,
                  },
                },
                updatedAt: true,
              },
            },
            roles: {
              select: {
                orgId: true,
                role: {
                  select: {
                    name: true,
                    permissions: true,
                  },
                },
              },
            },
          },
        }),
        this.prisma.userInvite.findMany({
          where: {
            email: token.email,
          },
          select: {
            id: true,
            email: true,
            role: {
              select: {
                label: true,
              },
            },
            org: {
              select: {
                id: true,
                name: true,
              },
            },
            invitedBy: {
              select: USER_BASIC_DETAILS,
            },
            createdAt: true,
          },
        }),
      ]);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const { orgs = [], ...rest } = user;
      return {
        ...rest,
        orgs,
        invites: userInvite,
      };
    } catch (error) {
      if (error?.name === 'TokenExpiredError') {
        throw new BadRequestException('Session expired, Please login again!');
      }
      throw new InternalServerErrorException('Failed to onboard details for user');
    }
  }

  async getUserOrgsAndInvites(userId: string, sessionToken: string) {
    try {
      const secret = this.config.get('SESSION_TOKEN_SECRET');
      if (!secret) {
        throw new Error('Please provide the Session Token Secret');
      }
      const token = verify(sessionToken, secret);
      if (!token) {
        throw new ForbiddenException('Session not valid. Please login again!');
      }
      const user = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          orgs: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch user orgs');
    }
  }

  async getUsersInvites(user: UserPayload) {
    try {
      const { email } = getUserDetails(user);
      return await this.prisma.userInvite.findMany({
        where: {
          email,
        },
        select: {
          id: true,
          email: true,
          role: {
            select: {
              name: true,
              label: true,
              id: true,
            },
          },
          invitedBy: {
            select: USER_BASIC_DETAILS,
          },
          org: {
            select: {
              name: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error('getUserInvites', 'Failed to fetch user invites', error);
      throw new InternalServerErrorException('Failed to get invites');
    }
  }

  async signup(data: UserSignupRequest) {
    this.logger.info('signup', 'Starting user signup process', { email: data.email });
    
    const connection = this.config.get('AUTH0_DB');
    if (!connection) {
      this.logger.error('signup', 'AUTH0_DB not configured in environment');
      throw new InternalServerErrorException('Authentication service not configured. Please contact support.');
    }
    
    this.logger.info('signup', 'Auth0 connection validated', { connection });
    
    let role: Role;
    try {
      role = await this.prisma.role.findFirst({
        where: { name: 'super-admin' }
      });
      
      if (!role) {
        this.logger.error('signup', 'Super admin role not found');
        throw new InternalServerErrorException('System configuration error. Please contact support.');
      }
      
      this.logger.info('signup', 'Found super-admin role', { roleId: role.id });
    } catch (error) {
      this.logger.error('signup', 'Failed to fetch super-admin role', error);
      throw new InternalServerErrorException('System configuration error. Please contact support.');
    }

    const { email, firstName, lastName, org, password } = data;
    
    try {
      this.logger.info('signup', 'Creating user and organization');
      const result = await this.createUserAndOrg(data, role.id);
      
      const roles = result.user.roles.reduce((acc, curr) => ({
        ...acc,
        [curr.orgId]: curr.role,
      }), {});

      this.logger.info('signup', 'Creating user in Auth0');
      return await this.createUserInAuth0(
        result.user.id,
        result.orgId,
        roles,
        { email, firstName, lastName, password },
        connection
      );
    } catch (error) {
      // Pass through exceptions that already have appropriate HTTP status codes
      if (error instanceof HttpException) {
        throw error;
      }
      
      // For any other unexpected errors
      this.logger.error('signup', 'Unexpected error during signup process', error);
      throw new InternalServerErrorException('An unexpected error occurred. Please try again later.');
    }
  }

  private async createUserAndOrg(data: UserSignupRequest, roleId: string) {
    const { email, firstName, lastName, org, password } = data;
    const userId = cuid();
    const orgId = cuid();

    try {
      this.logger.info('createUserAndOrg', 'Starting transaction', { userId, orgId });
      
      const [, , user] = await this.prisma.$transaction([
        // First create the user
        this.prisma.user.create({
          data: {
            id: userId,
            firstName,
            lastName,
            email,
            password: hashSync(password, 10),
            verified: false,
            blocked: false,
          },
          select: { id: true },
        }),
        // Then create the organization with the user as creator and member
        this.prisma.organization.create({
          data: {
            id: orgId,
            name: org,
            slug: `${kebabCase(org)}-${cuid()}`,
            createdById: userId,
            members: {
              connect: { id: userId },
            },
          },
          select: { id: true },
        }),
        // Finally create the role assignment
        this.prisma.user.update({
          where: { id: userId },
          data: {
            roles: {
              create: {
                orgId,
                roleId,
              },
            },
          },
          select: {
            id: true,
            orgs: {
              select: { id: true },
            },
            roles: {
              select: {
                id: true,
                orgId: true,
                role: {
                  select: {
                    name: true,
                    id: true,
                  },
                },
              },
            },
          },
        }),
      ]);

      this.logger.info('createUserAndOrg', 'Successfully created user and org', {
        userId,
        orgId,
        message: 'User created as both creator and member of organization'
      });

      return { user, orgId };
    } catch (error) {
      this.logger.error('createUserAndOrg', 'Failed to create user in database', error);
      
      if (error?.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new BadRequestException('An account with this email already exists in our database.');
      }
      
      throw new InternalServerErrorException('Failed to create user account. Please try again later.');
    }
  }

  // Method to delete a user from the local database
  private async createUserInAuth0(
    userId: string,
    orgId: string,
    rolesData: Record<string, { name: string; id: string }>,
    data: { email: string; firstName: string; lastName: string; password: string },
    connection: string
  ) {
    try {
      this.logger.info('createUserInAuth0', 'Preparing Auth0 user data', { 
        email: data.email,
        userId 
      });
      
      const auth0UserData: SignUpUserData = {
        family_name: data.lastName,
        given_name: data.firstName,
        password: data.password,
        email: data.email,
        connection,
        user_metadata: {
          server_signup: 'true',
          orgs: JSON.stringify([orgId]),
          userId,
          roles: JSON.stringify(rolesData),
        },
      };
      
      const result = await this.authClient.database.signUp(auth0UserData);
      
      this.logger.info('createUserInAuth0', 'Successfully created user in Auth0', { 
        email: data.email,
        userId 
      });
      
      return result;
    } catch (error) {
      await this.deleteUserFromLocal(userId);
      
      this.logger.error('createUserInAuth0', 'Failed to create user in Auth0', error);
      
      if (error instanceof Error) {
        // Handle common Auth0 errors
        if (error.name === 'APIError') {
          if (error.message?.includes('Password is too weak')) {
            throw new BadRequestException('Password is too weak. Please use a stronger password with a mix of letters, numbers, and special characters.');
          }
          if (error.message?.includes('already exists')) {
            throw new BadRequestException('An account with this email already exists.');
          }
          if (error.message?.includes('invalid email')) {
            throw new BadRequestException('Please provide a valid email address.');
          }
        }
      }
      
      throw new InternalServerErrorException('Failed to create account. Please try again later.');
    }
  }
    
  async findAll(query: RequestParams, user: UserPayload) {
    this.logger.info('findAll', 'Starting to fetch users list');
    
    const { org, role, userId } = getUserDetails(user);
    let whereCondition: Prisma.UserWhereInput = {};
    
    this.logger.info('findAll', 'Processing request', { 
      role: role.name,
      orgId: org.id
    });
    
    switch (role.name) {
      case 'user': {
        this.logger.info('findAll', 'Fetching projects for user role', { userId });
        let projects = [];
        try {
          const userData = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
              projects: {
                select: { id: true },
              },
            },
          });
          projects = userData.projects.map(({ id }) => id);
          
          this.logger.info('findAll', 'Found user projects', { 
            userId,
            projectCount: projects.length
          });
        } catch (error) {
          this.logger.error('findAll', 'Failed to fetch user details', error);
          throw new InternalServerErrorException('Failed to fetch users');
        }
        
        whereCondition = {
          AND: [
            {
              orgs: {
                some: { id: org.id },
              },
            },
            {
              projects: {
                some: {
                  id: { in: projects },
                },
              },
            },
          ],
        };
        break;
      }
      default:
        this.logger.info('findAll', 'Using org-level filter for admin role');
        whereCondition = {
          orgs: {
            some: { id: org.id },
          },
        };
        break;
    }
    
    const { skip, limit } = parseQuery(query);
    this.logger.info('findAll', 'Executing query', { skip, limit });
    
    try {
      const [payload, count] = await Promise.all([
        this.prisma.user.findMany({
          where: whereCondition,
          skip,
          take: limit,
          select: {
            ...USER_BASIC_DETAILS,
            createdAt: true,
            updatedAt: true,
            roles: {
              where: { orgId: org.id },
              select: {
                role: {
                  select: {
                    id: true,
                    label: true,
                    name: true,
                  },
                },
              },
            },
            orgs: { select: { id: true, name: true } },
          },
        }),
        this.prisma.user.count({ where: whereCondition }),
      ]);
      
      this.logger.info('findAll', 'Successfully fetched users', { 
        resultCount: payload.length,
        totalCount: count
      });
      
      return { payload, meta: { count } };
    } catch (error) {
      this.logger.error('findAll', 'Failed to fetch users', error);
      throw new InternalServerErrorException();
    }
  }

  async find(id: string, user: UserPayload) {
    const { org, role, projects } = getUserDetails(user);
    let whereCondition: Prisma.UserWhereInput = {
      id,
    };
    switch (role.name) {
      /**
       * 1. Users of the specified Org that are part of projects he/she is a member of
       */
      case 'user': {
        whereCondition = {
          ...whereCondition,
          AND: [
            {
              orgs: {
                some: {
                  id: org.id,
                },
              },
            },
            {
              projects: {
                some: {
                  id: {
                    in: projects ?? [],
                  },
                },
              },
            },
          ],
        };
        break;
      }
      /**
       * Super admin, Org Admin and Project Admin can see all the users of his org
       */
      default:
        whereCondition = {
          ...whereCondition,
          orgs: {
            some: {
              id: org.id,
            },
          },
        };
        break;
    }
    try {
      const userData = await this.prisma.user.findFirst({
        where: whereCondition,
        select: { ...USER_BASIC_DETAILS, createdAt: true, updatedAt: true, orgs: { select: { id: true, name: true } } },
      });
      if (!userData) {
        this.logger.error('findOne', 'User not found');
        throw new NotFoundException('User not found');
      }
      return userData;
    } catch (error) {
      this.logger.error('findOne', 'Failed to fetch user', error);
      throw new InternalServerErrorException();
    }
  }

  async updateUser(id: string, data: Partial<UserRequest>, user: UserPayload) {
    this.logger.info('updateUser', 'Starting user update process', { id });
    
    const { userId } = getUserDetails(user);
    if (id !== userId) {
      this.logger.error('updateUser', 'Cannot update other user data', 
        new Error(`User ${userId} attempted to update user ${id}`));
      throw new ForbiddenException('Not enough permissions to update the user details');
    }
    
    const { password, newPassword, orgId, email, roleId, ...rest } = data;
    this.logger.info('updateUser', 'Processing update fields', { 
      hasPassword: !!password,
      hasNewPassword: !!newPassword,
      fieldsToUpdate: Object.keys(rest)
    });
    
    let dataToUpdate: Prisma.UserUpdateInput = { ...rest };
    
    if (password !== null && newPassword !== null) {
      this.logger.info('updateUser', 'Processing password update request', { id });
      
      if (password === newPassword) {
        this.logger.error('updateUser', 'New password cannot be same as current');
        throw new BadRequestException('New password cannot be the same as your current password!');
      }
      
      try {
        const userData = await this.prisma.user.findUnique({
          where: { id },
          select: {
            email: true,
            password: true,
          },
        });
        
        if (!userData) {
          this.logger.error('updateUser', 'User not found', { id });
          throw new NotFoundException('User not found');
        }
        
        this.logger.info('updateUser', 'Validating current password', { email: userData.email });
        const passwordMatched = compareSync(password, userData.password);
        
        if (!passwordMatched) {
          this.logger.error('updateUser', 'Current password verification failed', { id });
          throw new ForbiddenException('Current password doesn\'t match');
        }
        
        this.logger.info('updateUser', 'Updating password in Auth0', { email: userData.email });
        const passwordUpdated = await this.updateUserPasswordInAuth0(userData.email, newPassword);
        
        if (passwordUpdated instanceof Error) {
          throw passwordUpdated;
        }
        
        this.logger.info('updateUser', 'Password updated in Auth0, updating in database', { id });
        dataToUpdate = {
          ...dataToUpdate,
          password: hashSync(newPassword, 10),
        };
      } catch (error) {
        if (error?.name === 'NotFoundError') {
          this.logger.error('updateUser', 'User not found', error);
          throw new NotFoundException('User not found');
        }
        this.logger.error('updateUser', 'Password update failed', error);
        throw new InternalServerErrorException('Something went wrong!');
      }
    }
    
    try {
      this.logger.info('updateUser', 'Updating user in database', { 
        id,
        fieldsUpdated: Object.keys(dataToUpdate)
      });
      
      const result = await this.prisma.user.update({
        where: { id },
        data: dataToUpdate,
        select: USER_BASIC_DETAILS,
      });
      
      this.logger.info('updateUser', 'Successfully updated user', { id });
      return result;
    } catch (error) {
      this.logger.error('updateUser', 'Failed to update user in database', error);
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async updateUserRole(id: string, roleId: string, user: UserPayload) {
    this.logger.info('updateUserRole', 'Starting role update process', {
      targetUserId: id,
      newRoleId: roleId
    });
    
    const { role, org } = getUserDetails(user);
    this.logger.info('updateUserRole', 'Processing request permissions', {
      requesterRole: role.name,
      orgId: org.id
    });
    
    let userData: { orgs: Array<{ id: string }>, roles: Array<any> } | null = null;

    if (!['super-admin', 'org-admin', 'admin'].includes(role.name)) {
      this.logger.error('updateUserRole', 'Insufficient permissions', new Error(
        `User with role ${role.name} attempted to update user role`
      ));
      throw new ForbiddenException('Not enough permissions to update the user details');
    }

    try {
      this.logger.info('updateUserRole', 'Fetching user details', { userId: id });
      userData = await this.prisma.user.findUnique({
        where: { id },
        select: {
          orgs: {
            select: { id: true }
          },
          roles: {
            where: { orgId: org.id },
            select: { id: true }
          }
        }
      });

      if (!userData) {
        this.logger.error('updateUserRole', 'User not found', new Error(`User ${id} not found`));
        throw new NotFoundException('User not found');
      }

      const userInOrg = userData.orgs.some(item => item.id === org.id);
      if (!userInOrg) {
        this.logger.error('updateUserRole', 'User not part of organization', new Error(
          `User ${id} not found in org ${org.id}`
        ));
        throw new ForbiddenException('Not enough permissions to update the role');
      }

      if (!userData.roles?.length) {
        this.logger.error('updateUserRole', 'User has no roles configured', new Error(
          `User ${id} has no roles in org ${org.id}`
        ));
        throw new InternalServerErrorException('Something went wrong.');
      }

      this.logger.info('updateUserRole', 'Preparing to update user role', {
        userId: id,
        newRoleId: roleId,
        orgId: org.id
      });

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          roles: {
            update: {
              where: { id: userData.roles[0].id },
              data: { roleId }
            }
          }
        },
        select: {
          ...USER_BASIC_DETAILS,
          createdAt: true,
          updatedAt: true,
          roles: {
            where: { orgId: org.id },
            select: {
              role: {
                select: {
                  id: true,
                  label: true
                }
              }
            }
          },
          orgs: { select: { id: true, name: true } }
        }
      });

      this.logger.info('updateUserRole', 'Successfully updated user role', {
        userId: id,
        newRoleId: roleId
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('updateUserRole', 'Failed to update role', error);
      throw new InternalServerErrorException('Failed to update role');
    }
  }

  async deleteUser(id: string, user: UserPayload) {
    const { role, org } = getUserDetails(user);
    let userData;
    try {
      userData = await this.prisma.user.findUnique({
        where: { id },
        select: {
          orgs: {
            select: {
              id: true,
            },
          },
          roles: {
            where: {
              orgId: org.id,
            },
            select: {
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
      
      if (!userData) {
        this.logger.error('delete', 'User not found');
        throw new NotFoundException('User not found');
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('delete', 'Failed to delete user', error);
      throw new InternalServerErrorException('Failed to remove user');
    }
    switch (role.name) {
      case 'super-admin': {
        try {
          return await this.prisma.user.update({
            where: {
              id,
            },
            data: {
              orgs: {
                disconnect: {
                  id: org.id,
                },
              },
            },
            select: USER_BASIC_DETAILS,
          });
        } catch (error) {
          this.logger.error('delete', 'Failed to remove user', error);
          throw new InternalServerErrorException('Failed to remove user');
        }
      }
      case 'admin': {
        try {
          const userInAdminOrg = userData.orgs.findIndex(({ id: orgId }) => orgId === org.id) >= 0;
          if (!userInAdminOrg) {
            this.logger.error('delete', 'Admin user is not part of the org, cannot remove user');
            throw new ForbiddenException('Not enough permissions');
          }
          return await this.prisma.user.update({
            where: {
              id,
            },
            data: {
              orgs: {
                disconnect: {
                  id: org.id,
                },
              },
            },
            select: USER_BASIC_DETAILS,
          });
        } catch (error) {
          this.logger.error('delete', 'Failed to remove user', error);
          throw new InternalServerErrorException('Failed to remove user');
        }
      }
      default:
        this.logger.error('delete', 'User with normal role cannot remove user');
        throw new ForbiddenException('Not enough permissions');
    }
  }

  // Method to delete a user from the local database
  private async deleteUserFromLocal(userId: string): Promise<boolean> {
    try {
      this.logger.info('deleteUserFromLocal', 'Removing user from database', { userId });
      await this.prisma.user.delete({
        where: { id: userId }
      });
      this.logger.info('deleteUserFromLocal', 'Successfully removed user', { userId });
      return true;
    } catch (error) {
      this.logger.error('deleteUserFromLocal', 'Failed to remove user', error);
      throw new InternalServerErrorException('Failed to clean up after error');
    }
  }

  // Local development fallback: handle Auth0 JWT tokens directly
  async getUserDetailsFromAuth0Token(auth0Token: string) {
    try {
      this.logger.info('getUserDetailsFromAuth0Token', 'Processing Auth0 JWT token for local development');
      
      // Decode the JWT without verification (for local development only)
      const decodedToken = decode(auth0Token) as any;
      
      if (!decodedToken || !decodedToken.sub) {
        this.logger.error('getUserDetailsFromAuth0Token', 'Invalid Auth0 token');
        throw new ForbiddenException('Invalid token');
      }
      
      const userId = decodedToken.sub;
      this.logger.info('getUserDetailsFromAuth0Token', 'Looking for user in database', { userId });
      
      // Try to find the user in our database
      let user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          orgs: {
            select: {
              id: true,
              name: true,
            },
          },
          projects: {
            select: {
              id: true,
              name: true,
              orgId: true,
            },
          },
          roles: {
            select: {
              orgId: true,
              role: {
                select: {
                  name: true,
                  label: true,
                  permissions: true,
                },
              },
            },
          },
        },
      });
      
      // If user doesn't exist, create them for local development
      if (!user) {
        this.logger.info('getUserDetailsFromAuth0Token', 'User not found in database, creating for local development');
        user = await this.createLocalDevUser(userId, decodedToken.email);
      }
      
      this.logger.info('getUserDetailsFromAuth0Token', 'Successfully found/created user', { email: user.email });
      
      const { orgs = [], projects = [], roles = [] } = user;
      const projectIds = projects.map(({ id }) => id);
      
      const rolesData = roles.reduce((acc, { role, orgId }) => {
        return {
          ...acc,
          [orgId]: role,
        };
      }, {});
      
      return {
        orgs,
        projects: projectIds,
        roles: rolesData,
        partOfMultipleOrgs: orgs.length > 1,
        pendingInvites: 0,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('getUserDetailsFromAuth0Token', 'Failed to process Auth0 token', error);
      throw new InternalServerErrorException('Failed to fetch user details');
    }
  }

  // Helper method to create a local development user
  private async createLocalDevUser(userId: string, email?: string) {
    try {
      this.logger.info('createLocalDevUser', 'Creating local development user', { userId, email });
      
      // Find super-admin role
      const superAdminRole = await this.prisma.role.findFirst({
        where: { name: 'super-admin' }
      });
      
      if (!superAdminRole) {
        this.logger.error('createLocalDevUser', 'Super admin role not found');
        throw new InternalServerErrorException('System configuration error');
      }
      
      const orgId = cuid();
      
      const user = await this.prisma.user.create({
        data: {
          id: userId,
          firstName: 'Local',
          lastName: 'User',
          email: email || `${userId}@local.dev`,
          password: 'temp-password', // Required field
          orgs: {
            create: {
              id: orgId,
              name: 'Local Development Org',
              slug: `local-dev-${orgId.slice(-8)}`,
              createdById: userId, // Self-reference since user is the creator
            },
          },
          roles: {
            create: {
              orgId,
              roleId: superAdminRole.id,
            },
          },
        },
        select: {
          email: true,
          orgs: {
            select: {
              id: true,
              name: true,
            },
          },
          projects: {
            select: {
              id: true,
              name: true,
              orgId: true,
            },
          },
          roles: {
            select: {
              orgId: true,
              role: {
                select: {
                  name: true,
                  label: true,
                  permissions: true,
                },
              },
            },
          },
        },
      });
      
      this.logger.info('createLocalDevUser', 'Successfully created local development user');
      return user;
    } catch (error) {
      this.logger.error('createLocalDevUser', 'Failed to create local development user', error);
      throw new InternalServerErrorException('Failed to create user');
    }
  }
}


