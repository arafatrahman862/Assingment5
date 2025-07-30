import express from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { BookingController } from "./booking.controller";
import { Role } from "../user/user.interface";


const router = express.Router();

router.post("/", checkAuth(...Object.values(Role)), BookingController.createBooking);
router.get("/my-bookings", checkAuth(...Object.values(Role)), BookingController.getMyBookings);
router.patch("/cancel/:id", checkAuth(...Object.values(Role)),BookingController.cancelBooking);

export const BookingRoutes =  router;
