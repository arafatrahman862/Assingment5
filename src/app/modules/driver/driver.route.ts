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
router.patch("/ride/:id/status", checkAuth(...Object.values(Role)),
validateRequest(updateRideStatusZodSchema),
DriverControllers.changeRideStatus
);
router.get("/earnings", checkAuth(...Object.values(Role)),DriverControllers.viewEarnings);

export const DriverRoutes = router;