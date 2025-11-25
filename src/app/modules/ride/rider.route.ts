import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { createRideZodSchema, rideFeedbackSchema } from "./rider.validation";
import { RiderController } from "./rider.controller";

const router = Router();

router.post(
  "/request",
  checkAuth(...Object.values(Role)),
  validateRequest(createRideZodSchema),
  RiderController.createRide
);

router.get(
  "/rides-near",
  checkAuth(Role.DRIVER),
  RiderController.getRidesNearMe
);

router.get(
  "/all-rides-admin",
  checkAuth(Role.ADMIN),
  RiderController.getAllRidesForAdmin
);

router.get("/all-feedbacks", RiderController.getFeedbacks);

router.get(
  "/all-rides-rider",
  checkAuth(Role.RIDER),
  RiderController.getAllRidesForRider
);
router.get(
  "/rider-latest-ride",
  checkAuth(Role.RIDER),
  RiderController.getRequestedRideForRider
);

router.get(
  "/all-rides-driver",
  checkAuth(Role.DRIVER),
  RiderController.getAllRidesForDriver
);

router.get(
  "/drivers-near",
  checkAuth(...Object.values(Role)),
  RiderController.getDriversNearMe
);

router.get(
  "/my-accepted-ride",
  checkAuth(Role.DRIVER),
  RiderController.getLatestAcceptedRideForDriver
);

router.get(
  "/my-ride/:id",
  checkAuth(Role.RIDER),
  RiderController.getSingleRideForRider
);
router.get(
  "/my-accepted-ride/:id",
  checkAuth(Role.DRIVER),
  RiderController.getSingleRideForDriver
);
router.get(
  "/single-ride/:id",
  checkAuth(Role.ADMIN),
  RiderController.getSingleRideForAdmin
);

router.patch(
  "/cancel-ride/:id",
  checkAuth(...Object.values(Role)),
  RiderController.cancelRideByRider
);

router.patch(
  "/reject-ride/:id",
  checkAuth(Role.DRIVER),
  RiderController.rejectRide
);

router.patch(
  "/accept-ride/:id",
  checkAuth(Role.DRIVER),
  RiderController.acceptRide
);

router.patch(
  "/ride-location-update/:id",
  checkAuth(Role.DRIVER, Role.RIDER),
  RiderController.updateRideLocation
);

router.patch(
  "/pickup-rider/:id",
  checkAuth(Role.DRIVER),
  RiderController.pickupRider
);

router.patch(
  "/start-ride/:id",
  checkAuth(Role.DRIVER),
  RiderController.startRide
);

router.patch(
  "/arrived-destination/:id",
  checkAuth(Role.DRIVER),
  RiderController.arrived
);

router.patch(
  "/pay-online/:id",
  checkAuth(Role.RIDER),
  RiderController.payOnline
);

router.patch(
  "/pay-offline/:id",
  checkAuth(Role.DRIVER),
  RiderController.payOffline
);

router.patch(
  "/feedback/:rideId",
  checkAuth(...Object.values(Role)),
  validateRequest(rideFeedbackSchema),
  RiderController.giveFeedback
);

export const RideRoutes = router;
