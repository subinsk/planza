import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private logger = new Logger('PERMISSION GUARD');
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const routePermissions = this.reflector.get<string[]>('permissions', context.getHandler());

    if (!routePermissions) {
      return true;
    }

    const user = context.getArgs()[0].user;
    const role = user['https://planza.app/role'];
    
    // TEMPORARY: If no role data from Auth0, allow access for debugging
    if (!role || !role.permissions) {
      this.logger.warn('No role/permissions found in JWT token - allowing access for debugging');
      console.log('User object:', JSON.stringify(user, null, 2));
      return true;
    }

    const userPermissions = role.permissions;
    const hasPermission = () => routePermissions.every((routePermission) => userPermissions.includes(routePermission));
    if (hasPermission()) {
      return true;
    }
    this.logger.error(`User doesn't have permission: ${routePermissions}`);
    throw new ForbiddenException('Not enough permissions to perform the operations');
  }
}

