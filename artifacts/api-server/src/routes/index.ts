import { Router, type IRouter } from "express";
import healthRouter from "./health";
import wallpapersRouter from "./wallpapers";
import favoritesRouter from "./favorites";
import generateRouter from "./generate";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(wallpapersRouter);
router.use(favoritesRouter);
router.use(generateRouter);
router.use(storageRouter);

export default router;
