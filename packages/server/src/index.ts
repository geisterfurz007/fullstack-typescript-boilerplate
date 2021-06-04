import "reflect-metadata";

import { PrismaClient } from "@prisma/client";
import { buildSchema, Ctx, NonEmptyArray, Query, Resolver } from "type-graphql";
import { Example } from "./__generated__/type-graphql";
import koa from "koa";
import { ApolloServer } from "apollo-server-koa";
import { createServerLogger } from "./log";

const logger = createServerLogger("src", "index");

interface PrismaContext {
  prisma: PrismaClient;
}

@Resolver(Example)
class TestResolver {
  @Query(() => [Example])
  async examples(@Ctx() { prisma }: PrismaContext): Promise<Example[]> {
    return await prisma.example.findMany();
  }
}

const prisma = new PrismaClient();

const main = async () => {
  // eslint-disable-next-line @typescript-eslint/ban-types
  const resolvers: NonEmptyArray<Function> = [TestResolver];
  const schema = await buildSchema({ resolvers });

  const port = process.env["BACKEND_PORT"] ?? 5000;
  const app = new koa();

  const server = new ApolloServer({
    schema,
    context: (): PrismaContext => ({ prisma }),
  });
  server.applyMiddleware({ app, cors: { origin: "*" } });

  app.listen({ port }, () => logger.info(`Backend listening on port ${port}`));
};

main().then(() => logger.debug("Launched server"));
