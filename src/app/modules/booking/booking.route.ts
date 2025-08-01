import express from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { BookingController } from "./booking.controller";
import { Role } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import { createBookingZodSchema, updateBookingZodSchema } from "./booking.validation";


const router = express.Router();

router.post(
  "/request",
  checkAuth(...Object.values(Role)),
  BookingController.createBooking,
  validateRequest(createBookingZodSchema)
);
router.get("/me", checkAuth(...Object.values(Role)), BookingController.getMyBookings);
router.patch(
  "/:id/status",
  checkAuth(...Object.values(Role)),
  BookingController.cancelBooking,
  validateRequest(updateBookingZodSchema)
);

export const BookingRoutes =  router;
