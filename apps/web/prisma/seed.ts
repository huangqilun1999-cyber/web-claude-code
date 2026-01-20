import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('开始创建默认测试账号...')

  // 检查是否已存在测试账号
  const existingUser = await prisma.user.findUnique({
    where: { email: 'admin@test.com' }
  })

  if (existingUser) {
    console.log('测试账号已存在，跳过创建')
    console.log('-----------------------------------')
    console.log('测试账号信息:')
    console.log('邮箱: admin@test.com')
    console.log('密码: admin123')
    console.log('-----------------------------------')
    return
  }

  // 创建密码哈希
  const passwordHash = await bcrypt.hash('admin123', 10)

  // 创建默认管理员账号
  const user = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      passwordHash,
      name: 'Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
    }
  })

  console.log('默认测试账号创建成功!')
  console.log('-----------------------------------')
  console.log('测试账号信息:')
  console.log('邮箱: admin@test.com')
  console.log('密码: admin123')
  console.log('用户ID:', user.id)
  console.log('-----------------------------------')
}

main()
  .catch((e) => {
    console.error('创建测试账号失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
