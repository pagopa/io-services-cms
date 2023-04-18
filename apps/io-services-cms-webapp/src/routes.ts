import { Router } from "express";
import { makeInfoHandler } from "./functions/info";

const router = Router();

// Info
router.get("/info", makeInfoHandler());

export default router;
