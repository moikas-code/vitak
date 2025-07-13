import { userRouter } from "./routers/user";
import { foodRouter } from "./routers/food";
import { mealLogRouter } from "./routers/meal-log";
import { creditRouter } from "./routers/credit";
import { mealPresetRouter } from "./routers/meal-preset";
import { adminRouter } from "./routers/admin";
import { createCallerFactory, createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  user: userRouter,
  food: foodRouter,
  mealLog: mealLogRouter,
  credit: creditRouter,
  mealPreset: mealPresetRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);