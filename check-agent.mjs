import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const agents = await prisma.agent.findMany()
  console.log('Agents:', JSON.stringify(agents, null, 2))
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
