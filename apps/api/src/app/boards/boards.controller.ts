import { BoardRequest, RequestParams, RequestWithUser } from '@planza/api-interfaces';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards, UsePipes } from '@nestjs/common';
import { PERMISSIONS } from '../core/config/permissions.config';
import { Permissions } from '../core/decorators/permissions.decorator';
import { Role } from '../core/decorators/roles.decorator';
import { PermissionsGuard } from '../core/guards/permissions.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { JoiValidationPipe } from '../core/pipes/validation/validation.pipe';
import { BoardsService } from './boards.service';
import { createBoardValidationSchema, updateBoardValidationSchema } from './boards.validation';

@Controller('boards')
export class BoardsController {
  constructor(private boardService: BoardsService) {}

  @UseGuards(RolesGuard, PermissionsGuard)
  @Role('project-admin')
  @Permissions(PERMISSIONS.board.create)
  @Post()
  @UsePipes(new JoiValidationPipe(createBoardValidationSchema))
  create(@Body() board: BoardRequest, @Req() req: RequestWithUser) {
    return this.boardService.create(board, req.user);
  }

  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSIONS.board.read)
  @Get()
  findAll(@Query() query: RequestParams, @Req() req: RequestWithUser) {
    return this.boardService.findAll(query, req.user);
  }

  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSIONS.board.read)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.boardService.findOne(id, req.user);
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @Role('project-admin')
  @Permissions(PERMISSIONS.board.update)
  @Patch(':id')
  @UsePipes(new JoiValidationPipe(updateBoardValidationSchema))
  update(@Param('id') id: string, @Body() board: BoardRequest, @Req() req: RequestWithUser) {
    return this.boardService.update(id, board, req.user);
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @Role('project-admin')
  @Permissions(PERMISSIONS.board.delete)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.boardService.remove(id, req.user);
  }
}


