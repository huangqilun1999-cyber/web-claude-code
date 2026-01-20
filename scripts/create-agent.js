const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  // 获取admin用户
  const user = await prisma.user.findUnique({ where: { email: 'admin@test.com' } });
  if (!user) {
    console.log('用户不存在');
    return;
  }

  // 检查是否已有agent
  let agent = await prisma.agent.findFirst({ where: { userId: user.id } });

  if (!agent) {
    // 创建新agent
    const secretKey = 'agent_' + crypto.randomBytes(32).toString('hex');
    agent = await prisma.agent.create({
      data: {
        userId: user.id,
        name: '本地开发机',
        description: '本地Windows开发环境',
        secretKey,
        type: 'LOCAL',
        isOnline: false,
      }
    });
    console.log('Agent创建成功');
  } else {
    console.log('Agent已存在');
  }

  console.log('-----------------------------------');
  console.log('Agent ID:', agent.id);
  console.log('Agent Name:', agent.name);
  console.log('Secret Key:', agent.secretKey);
  console.log('-----------------------------------');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
