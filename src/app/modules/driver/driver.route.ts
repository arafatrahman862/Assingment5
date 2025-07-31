import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { DriverControllers } from "./driver.controller";
import { Router } from "express";
import { updateRideStatusZodSchema } from "./driver.validation";


const router = Router();


router.patch(
  "/availability",
 checkAuth(...Object.values(Role)),
 DriverControllers.setAvailability
);
router.post(
  "/accept-ride",
  checkAuth(...Object.values(Role)),
  DriverControllers.acceptRideRequest
);
router.get(
  "/earnings",
  checkAuth(...Object.values(Role)),
  DriverControllers.viewEarnings
);
router.patch(
  "/update-profile",
  checkAuth(...Object.values(Role)),
  DriverControllers.updateDriverProfile,
  validateRequest(updateRideStatusZodSchema)
);
router.patch("/ride/:id/status", checkAuth(...Object.values(Role)),
validateRequest(updateRideStatusZodSchema),
DriverControllers.changeRideStatus
);
router.patch(
  "/approve/:id",
  checkAuth(Role.ADMIN || Role.SUPER_ADMIN),
  DriverControllers.approveDriverController,
  validateRequest(updateRideStatusZodSchema)
);
router.patch(
  "/suspend/:id",
  checkAuth(Role.ADMIN || Role.SUPER_ADMIN),
  DriverControllers.suspendDriverController,
  validateRequest(updateRideStatusZodSchema)
);
router.patch(
  "/reject/:id",
  checkAuth(Role.DRIVER),
  DriverControllers.rejectDriverController,
  validateRequest(updateRideStatusZodSchema)
);


export const DriverRoutes = router;