import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const validateTokensMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract access token and refresh token from headers or cookies
    const accessToken = req.headers.authorization?.split(":")[1];
    const refreshToken = req.cookies.refreshToken;
    console.log({ accessToken, refreshToken });
    if (!accessToken || !refreshToken) {
      return res
        .status(401)
        .json({ error: "Access token or refresh token not provided" });
    }
    // Verify access token
    const decodedAccessToken = jwt.verify(
      accessToken,
      process.env.JWT_SECRET!
    ) as { userId: number };

    // Verify refresh token
    const decodedRefreshToken = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET!
    ) as { userId: number };

    // Check if user IDs from both tokens match
    if (decodedAccessToken.userId !== decodedRefreshToken.userId) {
      return res.status(401).json({ error: "Invalid tokens" });
    }

    // If both tokens are valid, proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Error validating tokens:", error);
    return res.status(401).json({ error: "Invalid or expired tokens" });
  }
};

export default validateTokensMiddleware;
