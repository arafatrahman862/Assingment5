import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";

import { multerUpload } from "../../config/multer.config";
import { createDriverZodSchema, goOnlineZodSchema, updateDriverStatusZodSchema } from "./driver.validation";
import { DriverControllers } from "./driver.controller";

const router = Router();

router.patch(
  "/driver-location-update",
  checkAuth(Role.DRIVER),
  DriverControllers.updateLocation
);

router.post(
  "/register",
  checkAuth(...Object.values(Role)),
  multerUpload.single("file"),
  validateRequest(createDriverZodSchema),
  DriverControllers.createDriver
);
router.get("/me", checkAuth(Role.DRIVER), DriverControllers.getMe);

router.patch(
  "/update-my-driver-profile",
  checkAuth(Role.DRIVER),
  multerUpload.single("file"),
  DriverControllers.updateMyDriverProfile
);

router.patch(
  "/go-online",
  checkAuth(Role.DRIVER),
  validateRequest(goOnlineZodSchema),
  DriverControllers.goOnline
);

router.patch(
  "/go-offline",
  checkAuth(Role.DRIVER),
  DriverControllers.goOffline
);

router.patch(
  "/status/:id",
  checkAuth(Role.ADMIN),
  validateRequest(updateDriverStatusZodSchema),
  DriverControllers.updateDriverStatus
);

router.get(
  "/all-drivers",
  checkAuth(Role.ADMIN),
  DriverControllers.getAllDrivers
);

router.get("/:id", checkAuth(Role.ADMIN), DriverControllers.getSingleDriver);

export const DriverRoutes = router;
