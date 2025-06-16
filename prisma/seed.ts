import { Prisma, PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { hashSync } from 'bcryptjs';
import * as cuid from 'cuid';

config();
const prisma = new PrismaClient();

const ROLES_PERMISSIONS = [
  {
    name: 'super-admin',
    label: 'Super Admin',
    permissions: [
      'role:create',
      'role:read',
      'role:update',
      'role:delete',
      'user:create',
      'user:read',
      'user:update',
      'user:delete',
      'org:create',
      'org:read',
      'org:update',
      'org:delete',
      'project:create',
      'project:read',
      'project:update',
      'project:delete',
      'board:create',
      'board:read',
      'board:update',
      'board:delete',
      'task:create',
      'task:read',
      'task:update',
      'task:delete',
    ],
  },
  {
    name: 'admin',
    label: 'Admin',
    permissions: [
      'role:read',
      'user:create',
      'user:read',
      'user:update',
      'user:delete',
      'org:create',
      'org:read',
      'org:update',
      'org:delete',
      'project:create',
      'project:read',
      'project:update',
      'project:delete',
      'board:create',
      'board:read',
      'board:update',
      'board:delete',
      'task:create',
      'task:read',
      'task:update',
      'task:delete',
    ],
  },
  {
    name: 'user',
    label: 'User',
    permissions: [
      'user:read',
      'org:create',
      'org:read',
      'org:update',
      'org:delete',
      'project:read',
      'board:create',
      'board:read',
      'board:update',
      'board:delete',
      'task:create',
      'task:read',
      'task:update',
      'task:delete',
    ],
  },
];

// Add a default super admin user for local development
const DEFAULT_SUPER_ADMIN = {
  id: 'local-super-admin',
  email: 'admin@planza.local',
  firstName: 'Super',
  lastName: 'Admin',
  password: 'admin123', // Change this to a secure password
};

async function main() {
  // Create roles first
  const rolesData: Prisma.RoleCreateManyInput[] = ROLES_PERMISSIONS.map((item) => ({
    name: item.name,
    label: item.label,
    permissions: item.permissions,
  }));
  const roles = await Promise.all(
    rolesData.map((data) => {
      return prisma.role.upsert({
        where: { name: data.name },
        update: {},
        create: {
          name: data.name,
          label: data.label,
          permissions: data.permissions,
        },
      });
    }),
  );
  console.log(`Roles Created Successfully!`, roles.length);

  // Create default super admin user and org
  const superAdminRole = roles.find((role) => role.name === 'super-admin');
  if (superAdminRole) {
    const orgId = cuid();

    try {
      const superAdminUser = await prisma.user.upsert({
        where: { email: DEFAULT_SUPER_ADMIN.email },
        update: {},
        create: {
          id: DEFAULT_SUPER_ADMIN.id,
          email: DEFAULT_SUPER_ADMIN.email,
          firstName: DEFAULT_SUPER_ADMIN.firstName,
          lastName: DEFAULT_SUPER_ADMIN.lastName,
          password: hashSync(DEFAULT_SUPER_ADMIN.password, 10),
          verified: true,
          orgs: {
            create: {
              id: orgId,
              name: 'Planza Admin Organization',
              slug: 'planza-admin-org',
              createdById: DEFAULT_SUPER_ADMIN.id,
            },
          },
          roles: {
            create: {
              orgId,
              roleId: superAdminRole.id,
            },
          },
        },
      });

      console.log(`✅ Super Admin User Created Successfully!`);
      console.log(`📧 Email: ${superAdminUser.email}`);
      console.log(`🔑 Password: ${DEFAULT_SUPER_ADMIN.password}`);
      console.log(`🏢 Organization: Planza Admin Organization`);
    } catch (error) {
      console.log(`ℹ️  Super Admin User already exists: ${DEFAULT_SUPER_ADMIN.email}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
