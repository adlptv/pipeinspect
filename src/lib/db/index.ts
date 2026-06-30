import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function getAnalysis(id: string) {
  return prisma.analysis.findUnique({ where: { id } });
}

export async function listAnalyses(limit = 20, offset = 0) {
  return prisma.analysis.findMany({
    take: limit,
    skip: offset,
    orderBy: { createdAt: "desc" },
  });
}

export async function createAnalysis(data: {
  name: string;
  format: string;
  config: string;
  parsedPipeline: string;
  suggestions: string;
  complexityScore: number;
}) {
  return prisma.analysis.create({ data });
}

export async function deleteAnalysis(id: string) {
  return prisma.analysis.delete({ where: { id } });
}
