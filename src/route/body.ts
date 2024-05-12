import express from "express";
import { getBodyLogs, logBodyDimensionsAndWeight } from "../controller/body";

const router = express.Router();

router.post("/", logBodyDimensionsAndWeight);
router.get("/", getBodyLogs);

export default router;
