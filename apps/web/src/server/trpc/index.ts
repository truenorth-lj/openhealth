import { router } from "./trpc";
import { foodRouter } from "./routers/food";
import { diaryRouter } from "./routers/diary";
import { userRouter } from "./routers/user";
import { progressRouter } from "./routers/progress";
import { blogRouter } from "./routers/blog";
import { waterRouter } from "./routers/water";
import { chatRouter } from "./routers/chat";
import { referralRouter } from "./routers/referral";
import { subscriptionRouter } from "./routers/subscription";
import { notificationRouter } from "./routers/notification";
import { exerciseRouter } from "./routers/exercise";
import { fastingRouter } from "./routers/fasting";
import { coachRouter } from "./routers/coach";
import { postureRouter } from "./routers/posture";

export const appRouter = router({
  food: foodRouter,
  diary: diaryRouter,
  user: userRouter,
  progress: progressRouter,
  blog: blogRouter,
  water: waterRouter,
  chat: chatRouter,
  referral: referralRouter,
  subscription: subscriptionRouter,
  notification: notificationRouter,
  exercise: exerciseRouter,
  fasting: fastingRouter,
  coach: coachRouter,
  posture: postureRouter,
});

export type AppRouter = typeof appRouter;
