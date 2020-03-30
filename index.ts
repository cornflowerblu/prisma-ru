import * as path from 'path'
import { GraphQLServer } from 'graphql-yoga'
import { makePrismaSchema, prismaObjectType } from 'nexus-prisma'
import { prisma } from './generated/prisma-client'
import datamodelInfo from './generated/nexus-prisma'
import { stringArg, idArg } from 'nexus'

const Query = prismaObjectType<'Query'>({
  name: 'Query',
  definition: t => t.prismaFields(['*']),
})

const Mutation = prismaObjectType<'Mutation'>({
    name: 'Mutation',
    definition(t) {
      t.prismaFields(['createUser', 'updateUser', 'deleteUser', 'deletePost'])
      t.field('createDraft', {
          type: "Post",
          args: {
              title: stringArg(),
              content: stringArg({ nullable: true }),
          },
          resolve: (parent, {title, content}, ctx) => {
              return ctx.prisma.createPost({ title, content})
          },
      })
      t.field('Publish', {
          type: "Post",
          nullable: true,
          args: {
            id: idArg(),
          },
          resolve: (parent, { id }, ctx) => {
              return ctx.prisma.updatePost({
                  where: { id },
                  data: { published: true },
              })
          }
      })
    },
  })

const User = prismaObjectType<'User'>({
    name: 'User',
    definition: t => t.prismaFields(['id', 'name', 'posts'])
})

const schema = makePrismaSchema({
  types: [Query, Mutation, User],

  prisma: {
    datamodelInfo,
    client: prisma,
  },

  outputs: {
    schema: path.join(__dirname, './generated/schema.graphql'),
    typegen: path.join(__dirname, './generated/nexus.ts'),
  },
})

const server = new GraphQLServer({
  schema,
  context: { prisma },
})
server.start(() => console.log(`Server is running on http://localhost:4000`))