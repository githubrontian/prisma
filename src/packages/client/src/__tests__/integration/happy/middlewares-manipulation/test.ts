import { getTestClient } from '../../../../utils/getTestClient'

test('middlewares-manipulation', async () => {
  const PrismaClient = await getTestClient()
  const prisma = new PrismaClient()

  let theParams
  let firstCall = true
  prisma.$use(async (params, fetch) => {
    theParams = JSON.parse(JSON.stringify(params)) // clone
    if (firstCall) {
      params.args = {
        where: {
          email: 'asdasd', // this user doesn't exist
        },
      }
      firstCall = false
    }
    const result = await fetch(params)
    return result
  })

  prisma.$use(async (params, fetch) => {
    const result = await fetch(params)
    if (result.length > 0) {
      result[0].name += '2' // make sure that we can change the result
    }
    return result
  })

  const users = await prisma.user.findMany()

  expect(theParams).toEqual({
    dataPath: [],
    runInTransaction: false,
    action: 'findMany',
    model: 'User',
  })

  expect(users).toEqual([])

  const users2 = await prisma.user.findMany()
  expect(users2).toEqual([
    {
      email: 'a@a.de',
      id: '576eddf9-2434-421f-9a86-58bede16fd95',
      name: 'Alice2',
    },
  ])

  prisma.$disconnect()
})
