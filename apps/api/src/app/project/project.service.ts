import { ProjectRequest, RequestParams, Role, Roles, UpdateMembersRequest, UserPayload } from '@planza/api-interfaces';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { PlanzaLoggerService } from '../core/utils/logger.service';
import { getUserDetails } from '../core/utils/payload.util';
import { parseQuery } from '../core/utils/query-parse.util';
import { PrismaService } from '../prisma.service';
import { USER_BASIC_DETAILS } from '../task/task.config';

@Injectable()
export class ProjectService {
  private logger = this.planzaLogger.getLogger('PROJECT');
  constructor(private prisma: PrismaService, private planzaLogger: PlanzaLoggerService) {}

  async create(data: ProjectRequest, user: UserPayload) {
    const { org, role, userId } = getUserDetails(user);
    switch (role.name) {
      case 'super-admin':
        break;
      case 'admin':
      case 'org-admin':
        break;
      default:
        this.logger.error('create', 'No permission to create project');
        throw new ForbiddenException('No permissions to create project');
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
      const projectData: Prisma.ProjectCreateInput = {
        ...data,
        org: {
          connect: {
            id: org.id,
          },
        },
        createdBy: {
          connect: {
            id: userId,
          },
        },
        members: {
          connect: members,
        },
      };
      return await this.prisma.project.create({
        data: projectData,
        include: {
          org: {
            select: { id: true },
          },
          members: {
            select: USER_BASIC_DETAILS,
          },
        },
      });
    } catch (error) {
      this.logger.error('create', 'Failed to create project', error);
      throw new InternalServerErrorException();
    }
  }

  async findAll(query: RequestParams, user: UserPayload) {
    const { skip, limit, sort = 'createdAt', order = 'asc' } = parseQuery(query);
    const { org, role, userId } = getUserDetails(user);
    let where: Prisma.ProjectWhereInput = {
      orgId: org.id,
    };
    const select: Prisma.ProjectSelect = {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      boards: true,
      org: {
        select: {
          id: true,
        },
      },
      members: { select: USER_BASIC_DETAILS },
    };
    switch (role.name as Roles) {
      case 'user':
      case 'project-admin': {
        where = {
          ...where,
          members: {
            some: {
              id: userId,
            },
          },
        };
        break;
      }
      default:
        break;
    }
    try {
      const count$ = this.prisma.project.count({ where });
      const orgs$ = this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sort]: order,
        },
        select,
      });
      const [payload, count] = await Promise.all([orgs$, count$]);
      return {
        payload,
        meta: {
          count,
        },
      };
    } catch (error) {
      this.logger.error('findAll', 'Failed to fetch orgs', error);
      throw new InternalServerErrorException();
    }
  }

  async findOne(id: string, user: UserPayload) {
    const { role, userId } = getUserDetails(user);
    let project;
    try {
      project = await this.prisma.project.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          name: true,
          description: true,
          createdBy: {
            select: USER_BASIC_DETAILS,
          },
          createdAt: true,
          updatedAt: true,
          boards: true,
          members: { select: USER_BASIC_DETAILS },
        },
      });
      
      if (!project) {
        this.logger.error('findOne', 'Project not found');
        throw new NotFoundException('Project not found');
      }
    } catch (error) {
      if (error?.name === 'NotFoundError') {
        this.logger.error('findOne', 'Project not found', error);
        throw new NotFoundException('Project not found');
      }
      this.logger.error('findOne', 'Failed to fetch project', error);
      throw new InternalServerErrorException();
    }
    switch (role.name as Roles) {
      case 'user':
      case 'project-admin': {
        const isUserPartOfProject = (project.members as any[]).findIndex((member) => member?.id === userId) >= 0;
        if (!isUserPartOfProject) {
          this.logger.error('findOne', 'User has no access to the project');
          throw new ForbiddenException('No access to project');
        }
        break;
      }
      default:
        break;
    }
    return project;
  }

  async update(id: string, req: ProjectRequest, user: UserPayload) {
    const { role, userId } = getUserDetails(user);
    await this.canUpdateProject(role, id, userId);
    const { members, orgId, createdById, ...rest } = req;
    let data: Prisma.ProjectUpdateInput = { ...rest };
    if (members) {
      data = {
        ...data,
        members: {
          set: members.map((memberId) => ({ id: memberId })),
        },
      };
    }
    let project;
    try {
      project = await this.prisma.project.update({
        where: {
          id,
        },
        data,
        select: {
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          boards: true,
          members: { select: USER_BASIC_DETAILS },
        },
      });
      return project;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          this.logger.error('update', 'Project not found', error);
          throw new NotFoundException();
        }
      }
      this.logger.error('update', 'Failed to update project', error);
      throw new InternalServerErrorException('Failed to update project');
    }
  }

  async updateMembers(id: string, data: UpdateMembersRequest, user: UserPayload) {
    const { role, userId } = getUserDetails(user);
    await this.canUpdateProject(role, id, userId);
    let project;
    try {
      let updateData: Prisma.ProjectUpdateInput = {};
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
      project = await this.prisma.project.update({
        where: {
          id,
        },
        data: updateData,
        select: {
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          boards: true,
          members: { select: USER_BASIC_DETAILS },
        },
      });
      return project;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          this.logger.error('update', 'Project not found', error);
          throw new NotFoundException();
        }
      }
      this.logger.error('update', 'Failed to update members', error);
      throw new InternalServerErrorException('Failed to update members');
    }
  }

  async remove(id: string, user: UserPayload) {
    const { role, org } = getUserDetails(user);
    switch (role.name as Roles) {
      case 'user':
      case 'project-admin':
        this.logger.error('delete', `Role doesn't have permission to delete project`);
        throw new ForbiddenException('No permission to delete the project');
      default: {
        let project;
        try {
          project = await this.prisma.project.findUnique({
            where: {
              id,
            },
            select: {
              boards: true,
              orgId: true,
            },
          });
          
          if (!project) {
            this.logger.error('delete', 'Project not found');
            throw new NotFoundException('Project not found');
          }
        } catch (error) {
          if (error?.name === 'NotFoundError') {
            this.logger.error('delete', 'Project not found', error);
            throw new NotFoundException('Project not found');
          }
          this.logger.error('delete', 'Failed to delete project', error);
          throw new InternalServerErrorException('Failed to delete project');
        }
        if (project.orgId !== org.id) {
          this.logger.error('delete', 'User cannot delete project of different org');
          throw new ForbiddenException('No permission to delete the project');
        }
        if (project.boards.length > 0) {
          this.logger.error('delete', 'Project contains boards, cannot delete');
          throw new ConflictException('Cannot delete project as it contains boards.');
        }
        break;
      }
    }
    try {
      const project = await this.prisma.project.delete({
        where: {
          id,
        },
      });
      if (project) {
        return project;
      }
      throw new NotFoundException();
    } catch (error) {
      this.logger.error('delete', 'Failed to delete project', error);
      throw new InternalServerErrorException();
    }
  }

  private async canUpdateProject(role: Role, id: string, userId: string) {
    switch (role.name as Roles) {
      case 'user':
        this.logger.error('update', 'User role cannot update project');
        throw new ForbiddenException('Cannot update project');
      case 'project-admin':
        try {
          const projectData = await this.prisma.project.findUnique({
            where: {
              id,
            },
            select: {
              members: {
                where: {
                  id: userId,
                },
              },
            },
          });
          
          if (!projectData) {
            this.logger.error('update', 'Project not found');
            throw new NotFoundException('Project not found');
          }
          const userPartOfProject = projectData?.members.length > 0;
          if (!userPartOfProject) {
            this.logger.error('update', 'Project admins is not part of the project');
            throw new ForbiddenException('No permission to update the project');
          }
        } catch (error) {
          if (error?.name === 'NotFoundError') {
            this.logger.error('update', 'Project not found');
            throw new NotFoundException('Project not found');
          }
        }
    }
  }
}


