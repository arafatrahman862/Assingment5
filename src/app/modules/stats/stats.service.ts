import { User } from "../user/user.model";
import mongoose from "mongoose";
import { Driver } from "../driver/driver.model";
import AppError from "../../errorHelpers/AppError";
import httpStatus from "http-status-codes";
import { Ride } from "../ride/rider.model";
import { RideStatus } from "../ride/rider.interface";

export const getAdminStats = async () => {
  const totalRidersPromise = User.countDocuments({ role: "RIDER" });
  const totalDriversPromise = Driver.countDocuments();

  const totalCompletedRidesPromise = Ride.countDocuments({
    rideStatus: "COMPLETED",
  });
  const totalCancelledRidesPromise = Ride.countDocuments({
    rideStatus: "CANCELLED",
  });

  const totalFareMoneyPromise = Ride.aggregate([
    { $match: { rideStatus: "COMPLETED" } },
    { $group: { _id: null, totalFareMoney: { $sum: "$fare" } } },
  ]);

  const totalEarningsPromise = Ride.aggregate([
    { $match: { rideStatus: "COMPLETED" } },
    {
      $lookup: {
        from: "payments",
        localField: "payment",
        foreignField: "_id",
        as: "paymentData",
      },
    },
    { $unwind: "$paymentData" },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: "$paymentData.ownerIncome" },
      },
    },
  ]);

  const ridesDailyPromise = Ride.aggregate([
    { $match: { rideStatus: "COMPLETED" } },
    {
      $lookup: {
        from: "payments",
        localField: "payment",
        foreignField: "_id",
        as: "paymentData",
      },
    },
    { $unwind: "$paymentData" },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$timestamps.completedAt",
            timezone: "Asia/Dhaka",
          },
        },
        totalRides: { $sum: 1 },
        totalEarnings: { $sum: "$paymentData.ownerIncome" },
        totalFareMoney: { $sum: "$fare" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const ridesWeeklyPromise = Ride.aggregate([
    { $match: { rideStatus: "COMPLETED" } },
    {
      $lookup: {
        from: "payments",
        localField: "payment",
        foreignField: "_id",
        as: "paymentData",
      },
    },
    { $unwind: "$paymentData" },
    {
      $group: {
        _id: {
          year: {
            $year: { date: "$timestamps.completedAt", timezone: "Asia/Dhaka" },
          },
          week: {
            $isoWeek: {
              date: "$timestamps.completedAt",
              timezone: "Asia/Dhaka",
            },
          },
        },
        totalRides: { $sum: 1 },
        totalEarnings: { $sum: "$paymentData.ownerIncome" },
        totalFareMoney: { $sum: "$fare" },
      },
    },
    { $sort: { "_id.year": 1, "_id.week": 1 } },
  ]);

  const ridesMonthlyPromise = Ride.aggregate([
    { $match: { rideStatus: "COMPLETED" } },
    {
      $lookup: {
        from: "payments",
        localField: "payment",
        foreignField: "_id",
        as: "paymentData",
      },
    },
    { $unwind: "$paymentData" },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m",
            date: "$timestamps.completedAt",
            timezone: "Asia/Dhaka",
          },
        },
        totalRides: { $sum: 1 },
        totalEarnings: { $sum: "$paymentData.ownerIncome" },
        totalFareMoney: { $sum: "$fare" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const [
    totalRiders,
    totalDrivers,
    totalCompletedRides,
    totalCancelledRides,
    totalFareMoneyAgg,
    totalEarningsAgg,
    ridesDaily,
    ridesWeekly,
    ridesMonthly,
  ] = await Promise.all([
    totalRidersPromise,
    totalDriversPromise,
    totalCompletedRidesPromise,
    totalCancelledRidesPromise,
    totalFareMoneyPromise,
    totalEarningsPromise,
    ridesDailyPromise,
    ridesWeeklyPromise,
    ridesMonthlyPromise,
  ]);

  return {
    totalRiders,
    totalDrivers,
    totalCompletedRides,
    totalCancelledRides,
    totalFareMoney: totalFareMoneyAgg?.[0]?.totalFareMoney || 0,
    totalEarnings: totalEarningsAgg?.[0]?.totalEarnings || 0,
    ridesDaily,
    ridesWeekly,
    ridesMonthly,
  };
};

const getDriverStats = async (userId: string) => {
  const driver = await Driver.findOne({ userId });
  if (!driver) throw new AppError(httpStatus.NOT_FOUND, "Driver Not Found");

  const driverId = driver._id;

  const totalCompletedRidesPromise = Ride.countDocuments({
    driverId: new mongoose.Types.ObjectId(driverId),
    rideStatus: "COMPLETED",
  });

  const totalCancelledRidesPromise = Ride.countDocuments({
    driverId: new mongoose.Types.ObjectId(driverId),
    rideStatus: "CANCELLED",
  });

  const totalEarningsPromise = Ride.aggregate([
    {
      $match: {
        driverId: new mongoose.Types.ObjectId(driverId),
        rideStatus: "COMPLETED",
      },
    },
    {
      $lookup: {
        from: "payments",
        localField: "payment",
        foreignField: "_id",
        as: "paymentData",
      },
    },
    { $unwind: "$paymentData" },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: "$paymentData.driverIncome" },
      },
    },
  ]);

  const ridesDailyPromise = Ride.aggregate([
    {
      $match: {
        driverId: new mongoose.Types.ObjectId(driverId),
        rideStatus: "COMPLETED",
      },
    },
    {
      $lookup: {
        from: "payments",
        localField: "payment",
        foreignField: "_id",
        as: "paymentData",
      },
    },
    { $unwind: "$paymentData" },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$timestamps.completedAt",
            timezone: "Asia/Dhaka",
          },
        },
        totalRides: { $sum: 1 },
        totalIncome: { $sum: "$paymentData.driverIncome" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const ridesWeeklyPromise = Ride.aggregate([
    {
      $match: {
        driverId: new mongoose.Types.ObjectId(driverId),
        rideStatus: "COMPLETED",
      },
    },
    {
      $lookup: {
        from: "payments",
        localField: "payment",
        foreignField: "_id",
        as: "paymentData",
      },
    },
    { $unwind: "$paymentData" },
    {
      $group: {
        _id: {
          year: {
            $year: { date: "$timestamps.completedAt", timezone: "Asia/Dhaka" },
          },
          week: {
            $isoWeek: {
              date: "$timestamps.completedAt",
              timezone: "Asia/Dhaka",
            },
          },
        },
        totalRides: { $sum: 1 },
        totalIncome: { $sum: "$paymentData.driverIncome" },
      },
    },
    { $sort: { "_id.year": 1, "_id.week": 1 } },
  ]);

  const ridesMonthlyPromise = Ride.aggregate([
    {
      $match: {
        driverId: new mongoose.Types.ObjectId(driverId),
        rideStatus: "COMPLETED",
      },
    },
    {
      $lookup: {
        from: "payments",
        localField: "payment",
        foreignField: "_id",
        as: "paymentData",
      },
    },
    { $unwind: "$paymentData" },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m",
            date: "$timestamps.completedAt",
            timezone: "Asia/Dhaka",
          },
        },
        totalRides: { $sum: 1 },
        totalIncome: { $sum: "$paymentData.driverIncome" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const [
    totalCompletedRides,
    totalCancelledRides,
    totalEarningsAgg,
    ridesDaily,
    ridesWeekly,
    ridesMonthly,
  ] = await Promise.all([
    totalCompletedRidesPromise,
    totalCancelledRidesPromise,
    totalEarningsPromise,
    ridesDailyPromise,
    ridesWeeklyPromise,
    ridesMonthlyPromise,
  ]);

  return {
    totalCompletedRides,
    totalCancelledRides,
    totalEarnings: totalEarningsAgg?.[0]?.totalEarnings || 0,
    ridesDaily,
    ridesWeekly,
    ridesMonthly,
  };
};

const getRiderReport = async (userId: string) => {
  const rider = await User.findById(userId);
  if (!rider) throw new AppError(httpStatus.NOT_FOUND, "Rider Not Found");

  const totalCompletedRidesPromise = Ride.countDocuments({
    riderId: new mongoose.Types.ObjectId(userId),
    rideStatus: RideStatus.COMPLETED,
  });

  const totalCancelledRidesPromise = Ride.countDocuments({
    riderId: new mongoose.Types.ObjectId(userId),
    rideStatus: RideStatus.CANCELLED,
  });

  const totalSpentPromise = Ride.aggregate([
    {
      $match: {
        riderId: new mongoose.Types.ObjectId(userId),
        rideStatus: RideStatus.COMPLETED,
      },
    },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: "$fare" },
        avgFare: { $avg: "$fare" },
      },
    },
  ]);

  const ridesDailyPromise = Ride.aggregate([
    {
      $match: {
        riderId: new mongoose.Types.ObjectId(userId),
        rideStatus: RideStatus.COMPLETED,
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$timestamps.completedAt",
          },
        },
        totalRides: { $sum: 1 },
        totalFare: { $sum: "$fare" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const ridesWeeklyPromise = Ride.aggregate([
    {
      $match: {
        riderId: new mongoose.Types.ObjectId(userId),
        rideStatus: RideStatus.COMPLETED,
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$timestamps.completedAt" },
          week: { $isoWeek: "$timestamps.completedAt" },
        },
        totalRides: { $sum: 1 },
        totalFare: { $sum: "$fare" },
      },
    },
    { $sort: { "_id.year": 1, "_id.week": 1 } },
  ]);

  const ridesMonthlyPromise = Ride.aggregate([
    {
      $match: {
        riderId: new mongoose.Types.ObjectId(userId),
        rideStatus: RideStatus.COMPLETED,
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m", date: "$timestamps.completedAt" },
        },
        totalRides: { $sum: 1 },
        totalFare: { $sum: "$fare" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const [
    totalCompletedRides,
    totalCancelledRides,
    totalSpentAgg,
    ridesDaily,
    ridesWeekly,
    ridesMonthly,
  ] = await Promise.all([
    totalCompletedRidesPromise,
    totalCancelledRidesPromise,
    totalSpentPromise,
    ridesDailyPromise,
    ridesWeeklyPromise,
    ridesMonthlyPromise,
  ]);

  return {
    totalCompletedRides,
    totalCancelledRides,
    totalSpent: totalSpentAgg?.[0]?.totalSpent || 0,
    avgFare: totalSpentAgg?.[0]?.avgFare || 0,
    ridesDaily,
    ridesWeekly,
    ridesMonthly,
  };
};

export const StatsService = {
  getAdminStats,
  getDriverStats,
  getRiderReport,
};
