import { Request, Response } from "express";
import prisma from "../../prisma/client";

export const logExercise = async (req: Request, res: Response) => {
  const { userId, name, description, duration, time, day, date } = req.body;

  try {
    // Validate request body
    if (!userId || !name || !duration || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Save exercise in the database
    const exercise = await prisma.exercise.create({
      data: {
        userId,
        name,
        description,
        duration,
        time,
        day,
        date,
      },
    });

    return res
      .status(201)
      .json({ message: "Exercise logged successfully", exercise });
  } catch (error) {
    console.error("Error logging exercise:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getExercises = async (req: Request, res: Response) => {
  const { userId } = req.query;

  try {
    // Retrieve exercises from the database
    const exercises = await prisma.exercise.findMany({
      where: { userId: Number(userId) },
    });

    return res.json({ exercises });
  } catch (error) {
    console.error("Error fetching exercises:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
