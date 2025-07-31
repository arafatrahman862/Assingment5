import AppError from "../../errorHelpers/AppError";
import { BOOKING_STATUS, IBooking } from "../booking/booking.interface";
import { Booking } from "../booking/booking.model";
import httpStatus from "http-status-codes";

const createRideService = async (
  payload: Partial<IBooking>,
  userId: string
) => {
  const ride = await Booking.create({
    ...payload,
    user: userId,
    riderId: userId,
    status: BOOKING_STATUS.REQUESTED,
  });
  return ride;
};

 const cancelRideService = async (bookingId: string, userId: string) => {
  const ride = await Booking.findOne({ _id: bookingId, riderId: userId });
  if (!ride) {
    throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
  }
  if (ride.status !== BOOKING_STATUS.REQUESTED) {
    throw new AppError(httpStatus.BAD_REQUEST, "Ride cannot be cancelled now");
  }
  ride.status = BOOKING_STATUS.CANCELLED;
  await ride.save();
  return ride;
};

 const getRideHistoryService = async (userId: string) => {
  const rides = await Booking.find({ riderId: userId });
  return rides;
};

export const RiderServices = {
  createRideService,
  cancelRideService,
  getRideHistoryService,
};