import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import "dotenv/config"
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    create: {
      email: 'admin@company.com',
      name: 'System Admin',
      password: adminPassword,
      role: 'ADMIN',
      department: 'IT',
      storageUsed: 0,
      isActive: true,
    },
    update: {
      password: adminPassword,
      role: 'ADMIN',
      department: 'IT',
      isActive: true,
    },
  })
  console.log(`Created admin user: ${admin.email}`)

  const managerPassword = await bcrypt.hash('Manager@123', 10)
  const manager = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    create: {
      email: 'manager@example.com',
      name: 'Manager User',
      password: managerPassword,
      role: 'MANAGER',
      department: 'Operations',
      storageUsed: 0,
      isActive: true,
    },
    update: {
      password: managerPassword,
      role: 'MANAGER',
      department: 'Operations',
      isActive: true,
    },
  })

  const employeePassword = await bcrypt.hash('Employee@123', 10)
  const employee = await prisma.user.upsert({
    where: { email: 'employee@example.com' },
    create: {
      email: 'employee@example.com',
      name: 'Employee User',
      password: employeePassword,
      role: 'EMPLOYEE',
      department: 'Sales',
      storageUsed: 0,
      isActive: true,
    },
    update: {
      password: employeePassword,
      role: 'EMPLOYEE',
      department: 'Sales',
      isActive: true,
    },
  })

  // Create categories
  const hrCategory = await prisma.category.upsert({
    where: { slug: 'hr-policies' },
    update: {},
    create: {
      name: 'HR & Policies',
      slug: 'hr-policies',
      description: 'Human resources documents and company policies',
      allowedRoles: JSON.stringify(['ADMIN', 'MANAGER', 'EMPLOYEE']),
      createdById: admin.id,
    },
  })

  const companyDocs = await prisma.category.upsert({
    where: { slug: 'company-documents' },
    update: {},
    create: {
      name: 'Company Documents',
      slug: 'company-documents',
      description: 'General company documents',
      allowedRoles: JSON.stringify(['ADMIN', 'MANAGER']),
      createdById: admin.id,
    },
  })

  const projectsCategory = await prisma.category.upsert({
    where: { slug: 'projects-media' },
    update: {},
    create: {
      name: 'Projects & Media',
      slug: 'projects-media',
      description: 'Project files and media assets',
      allowedRoles: JSON.stringify(['ADMIN', 'MANAGER', 'EMPLOYEE']),
      createdById: admin.id,
    },
  })

  // Sub-categories
  await prisma.category.upsert({
    where: { slug: 'projects-marketing' },
    update: {},
    create: {
      name: 'Marketing',
      slug: 'projects-marketing',
      description: 'Marketing project assets',
      parentId: projectsCategory.id,
      allowedRoles: JSON.stringify(['ADMIN', 'MANAGER', 'EMPLOYEE']),
      createdById: admin.id,
    },
  })

  await prisma.category.upsert({
    where: { slug: 'projects-engineering' },
    update: {},
    create: {
      name: 'Engineering',
      slug: 'projects-engineering',
      description: 'Engineering project assets',
      parentId: projectsCategory.id,
      allowedRoles: JSON.stringify(['ADMIN', 'MANAGER', 'EMPLOYEE']),
      createdById: admin.id,
    },
  })

  console.log('Created categories')
  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
