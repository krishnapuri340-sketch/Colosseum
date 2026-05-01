import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import matchesRouter from "./matches";
import playersRouter from "./players";
import contestsRouter from "./contests";
import teamsRouter from "./teams";
import leaderboardRouter from "./leaderboard";
import dashboardRouter from "./dashboard";
import iplRouter from "./ipl";
import predictionsRouter from "./predictions";
import auctionRoomsRouter from "./auction-rooms";
import profileRouter from "./profile";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(matchesRouter);
router.use(playersRouter);
router.use(contestsRouter);
router.use(teamsRouter);
router.use(leaderboardRouter);
router.use(dashboardRouter);
router.use(iplRouter);
router.use(predictionsRouter);
router.use(auctionRoomsRouter);

export default router;
