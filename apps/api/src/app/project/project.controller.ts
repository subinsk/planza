import { ProjectRequest, RequestParams, RequestWithUser, UpdateMembersRequest } from '@planza/api-interfaces';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards, UsePipes } from '@nestjs/common';
import { PERMISSIONS } from '../core/config/permissions.config';
import { Permissions } from '../core/decorators/permissions.decorator';
import { Role } from '../core/decorators/roles.decorator';
import { PermissionsGuard } from '../core/guards/permissions.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { JoiValidationPipe } from '../core/pipes/validation/validation.pipe';
import { ProjectService } from './project.service';
import {
  createProjectValidationSchema,
  updateMembersValidationSchema,
  updateProjectValidationSchema,
} from './project.validation';

@Controller('projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @UseGuards(RolesGuard, PermissionsGuard)
  @Role('org-admin')
  @Permissions(PERMISSIONS.project.create)
  @Post()
  @UsePipes(new JoiValidationPipe(createProjectValidationSchema))
  create(@Body() project: ProjectRequest, @Req() req: RequestWithUser) {
    return this.projectService.create(project, req.user);
  }

  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSIONS.project.read)
  @Get()
  findAll(@Query() query: RequestParams, @Req() req: RequestWithUser) {
    return this.projectService.findAll(query, req.user);
  }

  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSIONS.project.read)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.projectService.findOne(id, req.user);
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @Role('org-admin')
  @Permissions(PERMISSIONS.project.update)
  @Patch(':id/members')
  @UsePipes(new JoiValidationPipe(updateMembersValidationSchema))
  updateMembers(@Param('id') id: string, @Body() data: UpdateMembersRequest, @Req() req: RequestWithUser) {
    return this.projectService.updateMembers(id, data, req.user);
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @Role('org-admin')
  @Permissions(PERMISSIONS.project.update)
  @Patch(':id')
  @UsePipes(new JoiValidationPipe(updateProjectValidationSchema))
  update(@Param('id') id: string, @Body() project: ProjectRequest, @Req() req: RequestWithUser) {
    return this.projectService.update(id, project, req.user);
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @Role('org-admin')
  @Permissions(PERMISSIONS.project.delete)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.projectService.remove(id, req.user);
  }
}


