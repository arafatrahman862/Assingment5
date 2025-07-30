import AppError from "../../errorHelpers/AppError";
import { BOOKING_STATUS, IRider } from "./rider.interface";
import { Rider } from "./rider.model";
import httpStatus from "http-status-codes";

const createRiderProfile = async (data: IRider) => {
  const existing = await Rider.findOne({ user: data.user });
  if (existing) {
    throw new AppError(httpStatus.BAD_REQUEST, "Rider profile already exists");
  }
  return Rider.create(data);
};

 const getRiderByUserId = async (userId: string) => {
   const rider = await Rider.findOne({ user: userId })
     .populate("bookings")
     .populate("rideHistory");

   if (!rider) {
     throw new AppError(httpStatus.NOT_FOUND, "Rider not found");
   }
   return rider;
 };

 const cancelRideRequest = async (riderId: string) => {
   const rider = await Rider.findById(riderId);
   if (!rider) {
     throw new AppError(httpStatus.NOT_FOUND, "Rider not found");
   }
   if (rider.status !== BOOKING_STATUS.PENDING) {
     throw new AppError(
       httpStatus.BAD_REQUEST,
       "Ride cannot be cancelled after acceptance"
     );
   }
   rider.status = BOOKING_STATUS.CANCEL;
   return rider.save();
 };

export const RiderServices = {
  createRiderProfile,
  getRiderByUserId,
  cancelRideRequest,
};