import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ── Permissions ──────────────────────────────────────────────
  const permissionDefs = [
    { resource: 'orders',  action: 'read'   },
    { resource: 'orders',  action: 'write'  },
    { resource: 'orders',  action: 'delete' },
    { resource: 'reports', action: 'read'   },
    { resource: 'users',   action: 'read'   },
    { resource: 'users',   action: 'write'  },
  ];

  const permissions = await Promise.all(
    permissionDefs.map((p) =>
      prisma.permission.upsert({
        where: { resource_action: { resource: p.resource, action: p.action } },
        update: {},
        create: p,
      })
    )
  );

  const perm = (resource: string, action: string) =>
    permissions.find((p) => p.resource === resource && p.action === action)!;

  console.log(`✅ ${permissions.length} permissions seeded`);

  // ── Roles ─────────────────────────────────────────────────────
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Full system access',
      rolePermissions: {
        create: permissions.map((p) => ({ permissionId: p.id })),
      },
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'manager' },
    update: {},
    create: {
      name: 'manager',
      description: 'Can manage orders and view reports',
      rolePermissions: {
        create: [
          { permissionId: perm('orders', 'read').id   },
          { permissionId: perm('orders', 'write').id  },
          { permissionId: perm('orders', 'delete').id },
          { permissionId: perm('reports', 'read').id  },
        ],
      },
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: 'Read-only access to orders',
      rolePermissions: {
        create: [{ permissionId: perm('orders', 'read').id }],
      },
    },
  });

  console.log('✅ 3 roles seeded (admin, manager, user)');

  // ── Sample Users ──────────────────────────────────────────────
  const SALT_ROUNDS = 12;

  const usersData = [
    { email: 'admin@example.com',   password: 'Admin@1234',   role: adminRole   },
    { email: 'manager@example.com', password: 'Manager@1234', role: managerRole },
    { email: 'user@example.com',    password: 'User@1234',    role: userRole    },
  ];

  for (const u of usersData) {
    const hashed = await bcrypt.hash(u.password, SALT_ROUNDS);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email:    u.email,
        password: hashed,
        userRoles: { create: { roleId: u.role.id } },
      },
    });
    console.log(`✅ User seeded: ${user.email} (role: ${u.role.name})`);
  }

  console.log('\n🎉 Seed complete!\n');
  console.log('Test credentials:');
  console.log('  admin@example.com   / Admin@1234');
  console.log('  manager@example.com / Manager@1234');
  console.log('  user@example.com    / User@1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
