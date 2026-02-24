const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    await prisma.nodeRun.deleteMany({});
    await prisma.workflowRun.deleteMany({});
    await prisma.workflow.deleteMany({});
    console.log('Database Wiped.');
}
main().catch(console.error);
