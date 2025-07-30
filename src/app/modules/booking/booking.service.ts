import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { BOOKING_STATUS, IBooking } from "./booking.interface";
import httpStatus from "http-status-codes";
import { Booking } from "./booking.model";


 const createBookingService = async (bookingData: IBooking) => {
   return await Booking.create(bookingData);
 };

const getRiderBookingsService = async (riderId: string) => {
  return await Booking.find({ riderId }).sort({ createdAt: -1 });
};

const cancelBookingService = async (bookingId: string) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }
  if (booking.status !== BOOKING_STATUS.REQUESTED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot cancel after ride is accepted"
    );
  }
  booking.status = BOOKING_STATUS.CANCELLED;
  return await booking.save();
};

export const BookingServices = {
  createBookingService,
  getRiderBookingsService,
  cancelBookingService,
};