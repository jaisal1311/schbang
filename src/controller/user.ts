import { Request, Response } from "express";
import prisma from "../../prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, role, firstName, lastName } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        isVerified: false,
      },
    });

    return res.status(201).send("User created successfully.");
  } catch (error) {
    console.log({ error });
    return res.status(500).send("An erorr occurred");
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      {
        expiresIn: "7d",
      }
    );

    return res
      .cookie("refreshToken", refreshToken)
      .status(200)
      .json({ accessToken, refreshToken });
  } catch (error) {
    console.log({ error });
    res.status(500).send("An erorr occurred");
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    // Since JWT is a stateless token, we can just delete the token from cookies from browser and user will get logged out.
    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error logging out:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(":")[1];
    // Verify the refresh token
    console.log({ token });
    const decoded = jwt.verify(token as string, process.env.JWT_SECRET!) as {
      userId: number;
    };

    // Extract user ID from the refresh token payload
    const userId = decoded.userId;

    // Retrieve the user from the database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate a new access token
    const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      {
        expiresIn: "7d",
      }
    );

    // Send the new access token in the response
    return res.json({ accessToken, refreshToken });
  } catch (error) {
    console.error("Error refreshing tokens:", error);
    return res.status(401).json({ error: "Invalid refresh token" });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // User not found with the provided email
      return res.status(404).json({ error: "User not found" });
    }

    // Generate a reset token
    const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    // Save the reset token in the user's record in the database
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken },
    });

    // Send email with reset token
    const resetLink = `${process.env.FRONT_END_DOMAIN}/reset-password?token=${resetToken}`;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: "Reset Your Password",
      html: `Click <a href="${resetLink}">here</a> to reset your password.`,
    };

    transporter.sendMail(mailOptions, (error: any) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ error: "Failed to send reset email" });
      }

      return res.json({ message: "Reset email sent successfully" });
    });
  } catch (error) {
    console.error("Error initiating password reset:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  try {
    // Verify the reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
    };

    // Extract user ID from the reset token payload
    const userId = decoded.userId;

    // Find user by ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      // User not found
      return res.status(404).json({ error: "User not found" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password in the database
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, resetToken: null },
    });

    return res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(401).json({ error: "Invalid or expired reset token" });
  }
};

export const sendVerificationEmail = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // User not found with the provided email
      return res.status(404).json({ error: "User not found" });
    }

    // Send email with verification link
    const verificationLink = `${process.env.FRONT_END_DOMAIN}/verify-email`;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: "Verify Your Email",
      html: `Click <a href="${verificationLink}">here</a> to verify your email address.`,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error("Error sending email:", error);
        return res
          .status(500)
          .json({ error: "Failed to send verification email" });
      }

      return res.json({ message: "Verification email sent successfully" });
    });
  } catch (error) {
    console.error("Error sending verification email:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    // Update user's record in the database to mark email as verified
    if (userId) {
      await prisma.user.update({
        where: { id: +userId },
        data: { isVerified: true },
      });
    }
    // Redirect to a success page or send a response indicating the verification status
    return res.redirect(`${process.env.FRONT_END_DOMAIN}/verification-success`);
  } catch (error) {
    console.error("Error verifying email:", error);
    return res.status(401).json({ error: "Error verifying email" });
  }
};
