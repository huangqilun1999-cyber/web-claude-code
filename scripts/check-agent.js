const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.agent.findFirst({
  where: { secretKey: 'e5df5d51022e26ee7df74e4fd423ab49e8716ae9bcd3a13117cd0e04e30467ac' }
})
.then(a => {
  console.log('Agent在线:', a.isOnline ? '✅ 是' : '❌ 否');
})
.finally(() => prisma.$disconnect());
