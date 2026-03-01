import { router } from "./trpc";
import { foodRouter } from "./routers/food";
import { diaryRouter } from "./routers/diary";
import { userRouter } from "./routers/user";
import { progressRouter } from "./routers/progress";
import { blogRouter } from "./routers/blog";
import { waterRouter } from "./routers/water";

export const appRouter = router({
  food: foodRouter,
  diary: diaryRouter,
  user: userRouter,
  progress: progressRouter,
  blog: blogRouter,
  water: waterRouter,
});

export type AppRouter = typeof appRouter;
