import {
  OrganizationRequest,
  RequestParams,
  Role,
  Roles,
  UpdateMembersRequest,
  UserPayload,
} from '@planza/api-interfaces';
import {
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { PlanzaLoggerService } from '../core/utils/logger.service';
import { getUserDetails } from '../core/utils/payload.util';
import { parseQuery } from '../core/utils/query-parse.util';
import { PrismaService } from '../prisma.service';
import { USER_BASIC_DETAILS } from '../task/task.config';

@Injectable()
export class OrganizationService {
  private logger = this.planzaLogger.getLogger('ORG');
  constructor(private prisma: PrismaService, private planzaLogger: PlanzaLoggerService) {}

  async create(data: OrganizationRequest, user: UserPayload) {
    const { userId } = getUserDetails(user);
    let role: Role;
    try {
      role = await this.prisma.role.findFirst({
        where: {
          name: 'super-admin',
        },
      });
      
      if (!role) {
        throw new Error('Super-admin role not found');
      }
    } catch (error) {
      this.logger.error('create', 'Failed to fetch the roles', error);
      throw new InternalServerErrorException('Failed to create org!');
    }
    try {
      let members = [];
      if (data.members?.length > 0) {
        members = data.members.map((id) => ({ id }));
        if (!data.members.includes(userId)) {
          members.push({ id: userId });
        }
      } else {
        members.push({ id: userId });
      }
      const orgData: Prisma.OrganizationCreateInput = {
        name: data.name,
        slug: data.slug,
        createdBy: {
          connect: {
            id: userId,
          },
        },
        userRoleOrgs: {
          create: {
            roleId: role.id,
            userId,
          },
        },
        members: {
          connect: members,
        },
      };
      return await this.prisma.organization.create({
        data: orgData,
        include: {
          userRoleOrgs: {
            where: {
              userId,
            },
            select: {
              role: {
                select: {
                  label: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      this.logger.error('create', 'Failed to create org', error);
      throw new InternalServerErrorException();
    }
  }

  async findAll(query: RequestParams, user: UserPayload) {
    const { userId } = getUserDetails(user);
    const { skip, limit, sort = 'createdAt', order = 'asc' } = parseQuery(query);
    
    // Log for debugging
    const userEmail = user?.['email'] || user?.['https://planza.app/email'];
    const userSub = user?.['sub'];
    
    this.logger.info('findAll', 'Searching for organizations', { 
      userId, 
      userEmail,
      userSub
    });
    
    // First check if user exists in database
    const localUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true }
    });
    
    if (!localUser) {
      this.logger.info('findAll', 'User not found by ID, trying Auth0 sub/email lookup', { userId, userEmail, userSub });
      
      // Use our new lookup function that handles both Auth0 sub and email
      const foundUser = await this.findUserByAuth0SubOrEmail(userSub || userId, userEmail);
      
      if (foundUser) {
        this.logger.info('findAll', 'Found user by lookup, using local user ID', { 
          originalUserId: userId, 
          actualUserId: foundUser.id 
        });
        
        return await this.findOrganizationsByUserId(foundUser.id, { skip, limit, sort, order });
      }
      
      this.logger.error('findAll', `User not found in database: userId=${userId}, userEmail=${userEmail}, userSub=${userSub}`);
      return {
        payload: [],
        meta: { count: 0 }
      };
    }
    
    // User exists, proceed with normal query
    return await this.findOrganizationsByUserId(userId, { skip, limit, sort, order });
  }

  private async findOrganizationsByUserId(userId: string, { skip, limit, sort, order }) {
    const where: Prisma.OrganizationWhereInput = {
      OR: [
        {
          createdById: userId,
        },
        {
          members: {
            some: {
              id: userId,
            },
          },
        },
      ],
    };
    
    try {
      const count$ = this.prisma.organization.count({
        where,
      });
      const orgs$ = this.prisma.organization.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sort]: order,
        },
        include: {
          userRoleOrgs: {
            where: {
              userId,
            },
            select: {
              role: {
                select: {
                  label: true,
                },
              },
            },
          },
        },
      });
      const [payload, count] = await Promise.all([orgs$, count$]);
      
      this.logger.info('findOrganizationsByUserId', 'Found organizations', { 
        userId, 
        count: payload.length 
      });
      
      return {
        payload,
        meta: {
          count,
        },
      };
    } catch (error) {
      this.logger.error('findOrganizationsByUserId', 'Failed to fetch orgs', error);
      throw new InternalServerErrorException();
    }
  }

  async findOne(id: string, user: UserPayload) {
    const { userId, role } = getUserDetails(user);
    const findOptions: Prisma.OrganizationFindFirstArgs = {
      where: {
        id,
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: USER_BASIC_DETAILS,
        },
        members: {
          select: USER_BASIC_DETAILS,
        },
        boards: true,
        name: true,
        projects: {
          include: {
            members: {
              select: USER_BASIC_DETAILS,
            },
          },
        },
        slug: true,
        tags: true,
        tasks: true,
      },
    };
    switch (role.name as Roles) {
      case 'user':
      case 'project-admin': {
        try {
          const userData = await this.prisma.user.findUnique({
            where: {
              id: userId,
            },
            select: {
              projects: {
                where: {},
                select: {
                  id: true,
                  members: {
                    select: { id: true },
                  },
                },
              },
            },
          });
          const membersOfProjectsUserHaveAccessTo = userData.projects.reduce((acc: string[], curr) => {
            return [...acc, ...curr.members.map((member) => member?.id)];
          }, []);
          /**
           * Only orgs he is part or owner of
           */
          findOptions.where = {
            id,
            OR: [
              {
                members: {
                  some: {
                    id: userId,
                  },
                },
              },
              {
                createdById: userId,
              },
            ],
          };
          (findOptions.select.projects as Prisma.ProjectFindManyArgs).where = {
            members: {
              some: {
                id: userId,
              },
            },
          };
          /**
           * Return only members of projects the user is part of
           */
          findOptions.select.members = {
            select: USER_BASIC_DETAILS,
            where: {
              id: {
                in: membersOfProjectsUserHaveAccessTo,
              },
            },
          };
        } catch (error) {
          if (error?.name === 'NotFoundError') {
            this.logger.error('findOne', 'User not found', error);
          }
          this.logger.error('findOne', 'Something went wrong', error);
          throw new InternalServerErrorException('Something went wrong');
        }
        break;
      }
      case 'org-admin':
      case 'admin': {
        /**
         * Only orgs he is part of or owner of
         */
        findOptions.where = {
          id,
          OR: [
            {
              members: {
                some: {
                  id: userId,
                },
              },
            },
            {
              createdById: userId,
            },
          ],
        };
        break;
      }
    }
    try {
      const org = await this.prisma.organization.findFirst(findOptions);
      if (org) {
        return org;
      }
      this.logger.error('findOne', 'Org not found');
      throw new NotFoundException('Org not found');
    } catch (error) {
      this.logger.error('findOne', 'Failed to fetch org', error);
      throw new InternalServerErrorException();
    }
  }

  async update(id: string, data: OrganizationRequest, user: UserPayload) {
    const { userId, role } = getUserDetails(user);
    const where: Prisma.OrganizationWhereUniqueInput = {
      id,
    };
    await this.canUpdateOrg(userId, id, role.name as Roles);
    const { members, createdById, ...rest } = data;
    try {
      const org = await this.prisma.organization.update({
        where,
        data: rest,
      });
      if (org) {
        return org;
      }
      throw new NotFoundException();
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          this.logger.error('update', 'Org not found', error);
          throw new NotFoundException();
        }
      }
      this.logger.error('update', 'Failed to update org', error);
      throw new InternalServerErrorException();
    }
  }

  async updateMembers(id: string, data: UpdateMembersRequest, user: UserPayload) {
    const { userId, role } = getUserDetails(user);
    await this.canUpdateOrg(userId, id, role.name as Roles);
    try {
      let updateData: Prisma.OrganizationUpdateInput = {};
      switch (data.type) {
        case 'modify':
          {
            const itemsToRemove = data?.remove?.length > 0 ? data.remove.map((item) => ({ id: item })) : [];
            const itemsToAdd = data?.add?.length > 0 ? data.add.map((item) => ({ id: item })) : [];
            updateData = {
              members: {
                disconnect: itemsToRemove,
                connect: itemsToAdd,
              },
            };
          }
          break;
        case 'set':
          {
            const itemsToSet = data?.set.length > 0 ? data.set.map((item) => ({ id: item })) : [];
            updateData = {
              members: {
                set: itemsToSet,
              },
            };
          }
          break;
      }
      const project = await this.prisma.organization.update({
        where: {
          id,
        },
        data: updateData,
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          members: {
            select: USER_BASIC_DETAILS,
          },
          boards: true,
          name: true,
          projects: true,
          slug: true,
          tags: true,
          tasks: true,
        },
      });
      if (project) {
        return project;
      }
      throw new NotFoundException();
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          this.logger.error('updateMembers', 'Org not found', error);
          throw new NotFoundException();
        }
      }
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('updateMembers', 'Failed to update members', error);
      throw new InternalServerErrorException();
    }
  }

  async remove(id: string, user: UserPayload) {
    const { userId, role } = getUserDetails(user);
    await this.canDeleteOrg(userId, id, role.name as Roles);
    try {
      await this.prisma.$transaction([
        this.prisma.userRoleOrg.deleteMany({
          where: {
            userId,
            orgId: id,
          },
        }),
        this.prisma.organization.delete({
          where: {
            id,
          },
        }),
      ]);
    } catch (error) {
      this.logger.error('Failed to delete org', error);
      throw new InternalServerErrorException();
    }
  }

  private canUpdateOrg = async (userId: string, orgId: string, role: Roles) => {
    const orgData = await this.getOrgDetail(orgId);
    switch (role) {
      /**
       * Can update the org if:
       * 1. Created by the user
       * 2. Is part of the org
       */
      case 'admin':
      case 'org-admin': {
        if (orgData.createdById !== userId || orgData.members.findIndex(({ id }) => id === userId) < 0) {
          this.logger.error('canUpdate', 'User not part of the org');
          throw new ForbiddenException('No permission to update the org');
        }
        break;
      }
      /**
       * Can update the org if:
       * 1. Created by the user
       */
      case 'user':
      case 'project-admin': {
        if (orgData.createdById !== userId) {
          this.logger.error('canUpdate', 'User has not permission');
          throw new ForbiddenException('No permission to update the org');
        }
        break;
      }
    }
    return orgData;
  };
  private canDeleteOrg = async (userId: string, orgId: string, role: Roles) => {
    const orgData = await this.getOrgDetail(orgId);
    switch (role) {
      /**
       * Can delete all orgs
       */
      case 'super-admin':
      case 'admin': {
        if (orgData.projects.length > 0) {
          this.logger.error('canDelete', 'Org contains live projects');
          throw new ConflictException('Cannot delete org as it contains projects.');
        }
        if (orgData.createdById !== userId || orgData.members.findIndex(({ id }) => id === userId) < 0) {
          this.logger.error('canDelete', 'User not owner or is part of the org');
          throw new ForbiddenException('No permission to delete the org');
        }
        break;
      }
      /**
       * Can delete the org if:
       * 1. Created by the user
       */
      default:
        if (orgData.createdById !== userId) {
          this.logger.error('canDelete', 'User has no permission');
          throw new ForbiddenException('No permission to delete the org');
        }
        break;
    }
    return orgData;
  };

  private async getOrgDetail(orgId) {
    try {
      const org = await this.prisma.organization.findUnique({
        where: { id: orgId },
        select: {
          createdById: true,
          projects: true,
          members: {
            select: { id: true },
          },
        },
      });
      
      if (!org) {
        throw new NotFoundException('Org not found');
      }
      
      return org;
    } catch (error) {
      if (error?.name === 'NotFoundError') {
        this.logger.error('getOrgDetail', 'Org not found', error);
        throw new NotFoundException('Org not found');
      }
      this.logger.error('getOrgDetail', 'Something went wrong', error);
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  private async findUserByAuth0SubOrEmail(auth0Sub: string, email?: string): Promise<User | null> {
    this.logger.info('findUserByAuth0SubOrEmail', 'Looking up user', { auth0Sub, email });
    
    let user = null;
    
    // First try to find by email if available
    if (email) {
      user = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, firstName: true, lastName: true }
      });
      
      if (user) {
        this.logger.info('findUserByAuth0SubOrEmail', 'Found user by email', { userId: user.id, email });
        return user;
      }
    }
    
    // If no user found by email, try to extract email from Auth0 sub
    // This is a fallback for when the JWT doesn't contain the email
    if (auth0Sub && auth0Sub.startsWith('auth0|')) {
      this.logger.info('findUserByAuth0SubOrEmail', 'User not found by email, Auth0 sub lookup not implemented yet', { auth0Sub });
      // TODO: In the future, we could query Auth0 Management API to get user email
      // or store the Auth0 sub in our database
    }
    
    this.logger.info('findUserByAuth0SubOrEmail', 'User not found', { auth0Sub, email });
    return null;
  }
}


