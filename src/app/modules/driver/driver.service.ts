/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errorHelpers/AppError";
import { DriverStatus, ICurrentLocation, IDriver } from "./driver.interface";
import { Driver } from "./driver.model";
import httpStatus from "http-status-codes";
import { User } from "../user/user.model";
import { IsBlocked, Role } from "../user/user.interface";
import { driverSearchableFields } from "./driver.contants";
import { QueryBuilder } from "../../utils/QueryBuilder";

const createDriver = async (payload: IDriver) => {
  const user = await User.findById(payload.userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  if (user.isBlocked === IsBlocked.BLOCKED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account is blocked. Contact support."
    );
  }
  if (!user.isVerified) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account is Not Verified. Contact support."
    );
  }

  const existingDriver = await Driver.findOne({ userId: payload.userId });

  if (existingDriver) {
    if (existingDriver.driverStatus === DriverStatus.PENDING) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You Are Already Registered! Please wait for admin approval!"
      );
    }
    if (existingDriver.driverStatus === DriverStatus.SUSPENDED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You are suspended. Please contact the office!"
      );
    }
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Driver profile already exists."
    );
  }

  const driver = await Driver.create(payload);
  return driver;
};

export const updateDriverStatus = async (
  id: string,
  driverStatus: DriverStatus
) => {
  const session = await Driver.startSession();
  session.startTransaction();

  try {
    const driver = await Driver.findById(id).session(session);
    if (!driver) {
      throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
    }

    if (
      driver.driverStatus === DriverStatus.APPROVED &&
      driverStatus === DriverStatus.APPROVED
    ) {
      throw new AppError(httpStatus.BAD_REQUEST, "Driver is already approved");
    }

    driver.driverStatus = driverStatus;
    await driver.save({ session });

    if (driverStatus === DriverStatus.APPROVED) {
      await User.findByIdAndUpdate(
        driver.userId,
        { role: Role.DRIVER },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    return driver;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getMe = async (userId: string) => {
  const driver = await Driver.findOne({ userId });
  return {
    data: driver,
  };
};

const updateMyDriverProfile = async (userId: string, updatedData: any) => {
  const driver = await Driver.findOne({ userId });
  if (!driver) throw new AppError(httpStatus.NOT_FOUND, "Driver not found");

  const updatedDriver = await Driver.findOneAndUpdate(
    { userId },
    { $set: updatedData },
    { new: true }
  );

  return updatedDriver;
};

const getAllDrivers = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(
    Driver.find().populate("userId"),
    query
  );

  const driverData = queryBuilder
    .filter()
    .search(driverSearchableFields)
    .sort()
    .fields()
    .dateSearch()
    .paginate();

  const [data, meta] = await Promise.all([
    driverData.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const getSingleDriver = async (id: string) => {
  const driver = await Driver.findById(id).populate({
    path: "userId",
    select: "-password -auths",
  });

  if (!driver) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
  }

  return {
    data: driver,
  };
};

const goOnline = async (userId: string, currentLocation: ICurrentLocation) => {
  const driverInfo = await Driver.findOne({ userId });
  if (!driverInfo) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
  }

  const driver = await Driver.findOneAndUpdate(
    { userId },
    {
      onlineStatus: "ONLINE",
      currentLocation: currentLocation,
    },
    { new: true }
  );
  return { data: driver };
};
const updateLocation = async (
  userId: string,
  currentLocation: ICurrentLocation
) => {
  const driverInfo = await Driver.findOne({ userId });
  if (!driverInfo) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
  }

  const driver = await Driver.findOneAndUpdate(
    { userId },
    {
      onlineStatus: "ONLINE",
      currentLocation: currentLocation,
    },
    { new: true }
  );
  return { data: driver };
};

const goOffline = async (userId: string) => {
  const driverInfo = await Driver.findOne({ userId });
  if (!driverInfo) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
  }

  const driver = await Driver.findOneAndUpdate(
    { userId },
    {
      onlineStatus: "OFFLINE",
      currentLocation: {
        type: "Point",
        coordinates: [],
      },
    },
    { new: true }
  );
  return { data: driver };
};

export const DriverServices = {
  createDriver,
  updateDriverStatus,
  getMe,
  updateMyDriverProfile,
  getAllDrivers,
  getSingleDriver,
  goOffline,
  goOnline,
  updateLocation,
};
