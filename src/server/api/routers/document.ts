import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const documentRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return [];
  }),
});
