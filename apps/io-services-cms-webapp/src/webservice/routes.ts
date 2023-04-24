import { Router } from "express";
import { makeInfoHandler } from "./controllers/info";

const router = Router();

// Info
router.get("/info", makeInfoHandler());

export default router;
