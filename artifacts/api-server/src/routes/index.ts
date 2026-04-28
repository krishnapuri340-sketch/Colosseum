import { Router, type IRouter } from "express";
import healthRouter from "./health";
import matchesRouter from "./matches";
import playersRouter from "./players";
import contestsRouter from "./contests";
import teamsRouter from "./teams";
import leaderboardRouter from "./leaderboard";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(matchesRouter);
router.use(playersRouter);
router.use(contestsRouter);
router.use(teamsRouter);
router.use(leaderboardRouter);
router.use(dashboardRouter);

export default router;
