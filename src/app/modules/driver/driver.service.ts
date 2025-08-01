import AppError from "../../errorHelpers/AppError";
import { BOOKING_STATUS, IBooking } from "../booking/booking.interface";
import { Booking } from "../booking/booking.model";
import { IUser, Role } from "../user/user.interface";
import { User } from "../user/user.model";
import { DRIVER_STATUS, IDriver } from "./driver.interface";
import { Driver } from "./driver.model";
import httpStatus from "http-status-codes";

const toggleDriverAvailability = async (userId: string, online: boolean) => {
  let driver = await Driver.findOne({ user: userId });
  console.log("Driver",driver)

  if (!driver) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
  }

  driver.isOnline = online;
  const savedDriver = await driver.save();

  console.log("Updated driver:", savedDriver);

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
      isOnline: false,
      status: DRIVER_STATUS.PENDING,
      ...payload
    });
  }

  return user;
};

// transaction Rollback
 const updateRideStatus = async (riderId: string, status: BOOKING_STATUS) => {
const existingRide = await Booking.findById(riderId);

// console.log(existingRide)
// console.log(rideId);
if (!existingRide) {
  throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
}

if (
  existingRide.status === BOOKING_STATUS.CANCELLED ||
  existingRide.status === BOOKING_STATUS.COMPLETED
) {
  throw new AppError(
    httpStatus.BAD_REQUEST,
    "Ride is already completed or cancelled"
  );
}

const updatedRide = await Booking.findByIdAndUpdate(
  riderId,
  { status },
  { new: true, runValidators: true }
);

return updatedRide;
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
  payload : any,
  userId:any
) => {
  // console.log(userId)
  const booking = await Booking.findById(payload.bookingId);

    if (!payload.bookingId) {
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

   const driver = await Driver.findOne({ user: userId });

  //  console.log(driver)
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
//  const rejectDriver = async (driverId: string) => {
//    const driver = await Driver.findById(driverId);
//    if (!driver) {
//      throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
//    }
//    driver.isApproved = false;
//    driver.isSuspended = true;
//    await driver.save();
//    return driver;
//  };
const rejectDriver = async (userId: string) => {
  const driver = await Driver.findOne({ user: userId },);
  console.log(driver)

  if (!driver) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
  }

  if (driver.isSuspended && driver.isApproved === false) {
    throw new AppError(httpStatus.CONFLICT, "Driver is already rejected");
  }

  driver.isApproved = false;
  driver.isSuspended = true;
  driver.status = DRIVER_STATUS.REJECTED;

  const updatedDriver = await driver.save();
  return updatedDriver;
};
const approveDriverService = async (driverId: string) => {
  const driver = await Driver.findById(driverId);
  console.log(driver)

  if (!driver) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
  }

  if (driver.isApproved) {
    throw new AppError(httpStatus.BAD_REQUEST, "Driver is already approved");
  }

  driver.isApproved = true;
  driver.status = DRIVER_STATUS.APPROVED;
  await driver.save();

  return driver;
};

// const updateDriverProfileService = async (
//   // payload: Partial<IUser>,
//   driverId: string,
//   payload: any,
  
// ) => {
//   console.log(driverId);
//   const updatedDriver = await Driver.findByIdAndUpdate(driverId, payload, {
//     new: true,
//     runValidators: true,
//   });

//   if (!updatedDriver) {
//     throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
//   }

//   return updatedDriver;
// };

const suspendDriver = async (driverId: string) => {
  const driver = await Driver.findById(driverId);
    if (!driver) {
      throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
    }
  driver.isSuspended = true;
  await driver.save();
  return driver;
};





export const DriverService = {
  toggleDriverAvailability,
  updateRideStatus,
  getDriverEarnings,
  acceptRideRequestService,
  // updateDriverProfileService,
  approveDriverService,
  suspendDriver,
  rejectDriver,
  promoteToDriver,
};