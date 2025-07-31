import express from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { RiderController } from "./rider.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import {  createRiderZodSchema } from "./rider.validation";
import { updateRideStatusZodSchema } from "../driver/driver.validation";



const router = express.Router();

router.post(
  "/request",
  checkAuth(...Object.values(Role)),
  RiderController.createRide,
  validateRequest(createRiderZodSchema)
);
router.get(
  "/me",
  checkAuth(...Object.values(Role)),
  RiderController.getRideHistory
);
router.patch(
  "/:id/status",
  checkAuth(...Object.values(Role)),
  RiderController.cancelRide,
  validateRequest(updateRideStatusZodSchema)
);

export const RiderRoutes = router;
