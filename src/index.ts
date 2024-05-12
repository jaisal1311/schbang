import express from "express";
import authRoutes from "./route/user";
import exerciseRoutes from "./route/exercise";
import bodyRoutes from "./route/body";
import validateTokensMiddleware from "./middleware/tokenCheck";
import cookies from "cookie-parser";
import rateLimit from "express-rate-limit";

const app = express();

app.use(express.json());
app.use(cookies());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again later",
});

app.use(limiter);

app.use("/auth", authRoutes);
app.use("/exercise", validateTokensMiddleware, exerciseRoutes);
app.use("/body", validateTokensMiddleware, bodyRoutes);

app.use((req, res, next) => {
  if (res.getHeader("X-RateLimit-Remaining") === "0") {
    // Rate limit exceeded
    return res
      .status(429)
      .json({ error: "Too many requests, please try again later" });
  }
  // Pass the request to the next middleware
  next();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
