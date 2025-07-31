import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { BOOKING_STATUS, IBooking } from "./booking.interface";
import httpStatus from "http-status-codes";
import { Booking } from "./booking.model";


 const createBookingService = async (
   payload: Partial<IBooking>,
   userId: string
 ) => {
   if (!payload.pickup || !payload.destination_location) {
     throw new AppError(
       httpStatus.BAD_REQUEST,
       "Pickup and Destination are required"
     );
   }

   const existingActive = await Booking.findOne({
     user: userId,
     status: {
       $in: [
         BOOKING_STATUS.REQUESTED,
         BOOKING_STATUS.ACCEPTED,
         BOOKING_STATUS.PICK_UP,
         BOOKING_STATUS.IN_TRANSIT,
       ],
     },
   });
   if (existingActive) {
     throw new AppError(
       httpStatus.CONFLICT,
       "You already have an ongoing ride"
     );
   }

   const booking = await Booking.create({
     ...payload,
     user: userId,
     status: BOOKING_STATUS.REQUESTED,
   });
   return booking;
 };

const getRideHistoryService = async (userId: string) => {
  const rides = await Booking.find({ user: userId }).sort({
    createdAt: -1,
  });
  return rides;
};

const cancelBookingService = async (rideId: string, userId: string) => {
  const ride = await Booking.findById(rideId);
  if (!ride) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }
  if (ride.user.toString() !== userId)
    throw new AppError(httpStatus.FORBIDDEN, "Unauthorized");

  if (ride.status !== BOOKING_STATUS.REQUESTED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only pending rides can be cancelled"
    );
  }

  ride.status = BOOKING_STATUS.CANCELLED;
  await ride.save();
  return ride;
};

export const BookingServices = {
  createBookingService,
  getRideHistoryService,
  cancelBookingService,
};