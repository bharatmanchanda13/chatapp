import { seedAdmin } from './admin.seed';

async function main() {
    await seedAdmin();
}

main()
    .then(() => {
        console.log('Seeding completed');
    })
    .catch((e) => {
        console.error(e);
    });