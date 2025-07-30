import { Booking } from "../booking/booking.model";
import { Driver } from "./driver.model";

export const toggleDriverAvailability = async (
  driverId: string,
  online: boolean
) => {
  return Driver.findByIdAndUpdate(driverId, { online }, { new: true });
};

export const updateRideStatus = async (rideId: string, status: string) => {
  return Booking.findByIdAndUpdate(rideId, { status }, { new: true });
};

export const getDriverEarnings = async (driverId: string) => {
  const rides = await Booking.find({ driverId, status: "completed" });
  const total = rides.reduce((sum, ride) => sum + (ride.fare || 0), 0);
  return { totalEarnings: total, rides };
};
 