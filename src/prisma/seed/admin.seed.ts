import 'dotenv/config';

import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function seedAdmin() {
    const existingAdmin = await prisma.user.findFirst({
        where: {
            role: Role.ADMIN,
        },
    });

    if (existingAdmin) {
        console.log('Admin already exists');
        return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    await prisma.user.create({
        data: {
            name: 'Admin',
            email: 'admin@gmail.com',
            password: hashedPassword,
            role: Role.ADMIN,
        },
    });

    console.log('Admin seeded');
}