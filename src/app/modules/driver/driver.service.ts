import AppError from "../../errorHelpers/AppError";
import { BOOKING_STATUS, IBooking } from "../booking/booking.interface";
import { Booking } from "../booking/booking.model";
import { IUser, Role } from "../user/user.interface";
import { User } from "../user/user.model";
import { IDriver } from "./driver.interface";
import { Driver } from "./driver.model";
import httpStatus from "http-status-codes";

const toggleDriverAvailability = async (userId: string, online: boolean) => {

  let driver = await Driver.findOne({ user: userId });


  if (!driver) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }


    driver = await Driver.create({
      user: user._id,
      email: user.email,
      isApproved: false,
      isSuspended: false,
      online: online, 
    });
  } else {
  
    driver.isOnline = online;
    await driver.save();
  }


  return driver;
};

 const promoteToDriver = async (payload: Partial<IDriver> ,userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");
  user.role = Role.DRIVER;
  await user.save();

  const existingDriver = await Driver.findOne({ user: userId });
  if (!existingDriver) {
    await Driver.create({
      user: user._id,
      email: user.email,
      isApproved: false,
      isSuspended: false,
      online: false,
      ...payload
    });
  }

  return user;
};

 const updateRideStatus = async (rideId: string, status: BOOKING_STATUS) => {
   const ride = await Booking.findByIdAndUpdate(
     rideId,
     { status },
     { new: true }
   );
   if (!ride) {
    throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
   }

     if (
       ride.status === BOOKING_STATUS.CANCELLED ||
       ride.status === BOOKING_STATUS.COMPLETED
     ) {
       throw new AppError(
         httpStatus.BAD_REQUEST,
         "Ride is already completed or cancelled"
       );
     }
   ride.status = status;
   await ride.save();
   return ride;
};

const getDriverEarnings = async (driverId: string) => {
  const rides = await Booking.find({
    driverId,
    status: BOOKING_STATUS.COMPLETED,
  });
  const total = rides.reduce((sum, ride) => sum + (ride.fare || 0), 0);
  return { totalEarnings: total, rides };
};
 

const acceptRideRequestService = async (
  payload: Partial<IBooking>,
  userId: string
) => {
  const booking = await Booking.findById(payload._id);

    if (!payload._id) {
      throw new AppError(httpStatus.BAD_REQUEST, "Booking ID is required");
    }

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }

  if (booking.status !== BOOKING_STATUS.REQUESTED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Ride is not available for acceptance"
    );
  }

   const driver = await Driver.findById(userId);
   if (!driver) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
   }
   if (!driver.isOnline)
     throw new AppError(
       httpStatus.FORBIDDEN,
       "Driver must be online to accept rides"
     );

   const ongoingRide = await Booking.findOne({
     driverId: userId,
     status: {
       $in: [
         BOOKING_STATUS.ACCEPTED,
         BOOKING_STATUS.PICK_UP,
         BOOKING_STATUS.IN_TRANSIT,
       ],
     },
   });
   if (ongoingRide)
     throw new AppError(httpStatus.CONFLICT, "You are already on a ride");


  booking.driverId = userId;
  booking.status = BOOKING_STATUS.ACCEPTED;

  const updatedBooking = await booking.save();
  return updatedBooking;
};
const approveDriverService = async (driverId: string) => {
  const driver = await Driver.findById(driverId);

  if (!driver) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
  }

  if (driver.isApproved) {
    throw new AppError(httpStatus.BAD_REQUEST, "Driver is already approved");
  }

  driver.isApproved = true;
  await driver.save();

  return driver;
};

const updateDriverProfileService = async (
  payload: Partial<IUser>,
  driverId: string
) => {
  const updatedDriver = await Driver.findByIdAndUpdate(driverId, payload, {
    new: true,
    runValidators: true,
  });

  if (!updatedDriver) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
  }

  return updatedDriver;
};

const suspendDriver = async (driverId: string) => {
  const driver = await Driver.findById(driverId);
    if (!driver) {
      throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
    }
  driver.isSuspended = true;
  await driver.save();
  return driver;
};

 const rejectDriver = async (driverId: string) => {
  const driver = await Driver.findById(driverId);
  if (!driver) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
  }
  driver.isApproved = false;
  driver.isSuspended = true;
  await driver.save();
  return driver;
}



export const DriverService = {
  toggleDriverAvailability,
  updateRideStatus,
  getDriverEarnings,
  acceptRideRequestService,
  updateDriverProfileService,
  approveDriverService,
  suspendDriver,
  rejectDriver,
  promoteToDriver,
};