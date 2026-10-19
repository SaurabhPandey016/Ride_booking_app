import type { CookieOptions, Response } from "express";

const authCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

export const setAuthCookie = (res: Response, token: string): void => {
  res.cookie("token", token, authCookieOptions);
};

export const clearAuthCookie = (res: Response): void => {
  res.clearCookie("token", {
    httpOnly: authCookieOptions.httpOnly,
    sameSite: authCookieOptions.sameSite,
    secure: authCookieOptions.secure,
    path: authCookieOptions.path,
  });
};
