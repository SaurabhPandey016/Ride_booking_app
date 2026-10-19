import { Router } from "express";
import { reverse, route, search } from "../controllers/maps.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const mapsRouter = Router();

mapsRouter.use(authenticate);
mapsRouter.get("/search", asyncHandler(search));
mapsRouter.get("/reverse", asyncHandler(reverse));
mapsRouter.post("/route", asyncHandler(route));
