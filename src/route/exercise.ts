import express from "express";
import { getExercises, logExercise } from "../controller/exercise";

const router = express.Router();

router.post("/", logExercise);
router.get("/", getExercises);

export default router;
