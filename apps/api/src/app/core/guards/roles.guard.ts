import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { Roles } from '../config/roles.config';
import { isOperationAllowed } from '../utils/roles-permission.util';

@Injectable()
export class RolesGuard implements CanActivate {
  private logger = new Logger('ROLES GUARD');
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const requireRole = this.reflector.get<Roles>('role', context.getHandler());

    if (!requireRole) {
      return true;
    }

    const user = context.getArgs()[0].user;
    const userRole = user['https://planza.app/role'] ?? null;
    
    // TEMPORARY: If no role data from Auth0, allow access for debugging
    if (!userRole) {
      this.logger.warn(`No role found in JWT token (required: ${requireRole}) - allowing access for debugging`);
      console.log('User object:', JSON.stringify(user, null, 2));
      return true;
    }

    const hasAuthority = () => isOperationAllowed(requireRole, userRole);
    if (hasAuthority()) {
      return true;
    }
    this.logger.error({
      userRole: userRole?.name,
      requireRole,
    });
    throw new ForbiddenException('No authority to perform the operation');
  }
}

