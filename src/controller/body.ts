import { Request, Response } from "express";
import prisma from "../../prisma/client";

export const logBodyDimensionsAndWeight = async (
  req: Request,
  res: Response
) => {
  const { userId, weight, height, bicepSize, thighSize, bellySize } = req.body;

  try {
    // Validate request body
    if (
      !userId ||
      !weight ||
      !height ||
      !bicepSize ||
      !thighSize ||
      !bellySize
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Save body log in the database
    const bodyLog = await prisma.bodyLog.create({
      data: {
        userId,
        weight,
        height,
        bicepSize,
        thighSize,
        bellySize,
      },
    });

    return res.status(201).json({
      message: "Body dimensions and weight logged successfully",
      bodyLog,
    });
  } catch (error) {
    console.error("Error logging body dimensions and weight:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getBodyLogs = async (req: Request, res: Response) => {
  const { userId } = req.query;

  try {
    // Retrieve body logs from the database
    const bodyLogs = await prisma.bodyLog.findMany({
      where: { userId: Number(userId) },
    });

    return res.json({ bodyLogs });
  } catch (error) {
    console.error("Error fetching body logs:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
