import 'dotenv/config';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Missing DATABASE_URL in environment');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const tenantSlug = 'csp-baleares';
  const tenantName = 'CSP Baleares';
  const adminEmail = 'administracion@cspbaleares.com';
  const adminName = 'andreu';

  const tempPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!tempPassword) {
    throw new Error('Missing SEED_ADMIN_PASSWORD in environment');
  }

  const passwordHash = await argon2.hash(tempPassword, {
    type: argon2.argon2id,
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: tenantSlug },
    update: {},
    create: {
      name: tenantName,
      slug: tenantSlug,
      isActive: true,
    },
  });

  const rolePlatformAdmin = await prisma.role.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'platform_admin',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'platform_admin',
      description: 'Administrador de plataforma del tenant',
    },
  });

  const user = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: adminEmail,
      },
    },
    update: {
      fullName: adminName,
      isActive: true,
      isSuperAdmin: true,
      passwordHash,
      passwordChangedAt: null,
      failedLoginCount: 0,
      lockedUntil: null,
    },
    create: {
      tenantId: tenant.id,
      email: adminEmail,
      fullName: adminName,
      passwordHash,
      isActive: true,
      isSuperAdmin: true,
      mfaEnabled: false,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: rolePlatformAdmin.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: rolePlatformAdmin.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: user.id,
      action: 'seed.bootstrap',
      entityType: 'system',
      entityId: user.id,
      severity: 'info',
      status: 'success',
      source: 'seed-script',
      metadata: {
        message: 'Initial tenant and superadmin created',
        email: adminEmail,
      },
    },
  });

  console.log('Seed completed');
  console.log(`Tenant: ${tenant.slug}`);
  console.log(`Admin: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
