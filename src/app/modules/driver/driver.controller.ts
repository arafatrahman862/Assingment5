/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextFunction, Request, Response } from "express";

import httpStatus from "http-status-codes";

import { sendResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";
import { IDriver } from "./driver.interface";
import { JwtPayload } from "jsonwebtoken";
import { DriverServices } from "./driver.service";

const createDriver = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    const userId = user.userId;

    const payload: IDriver = {
      ...req.body,
      userId,
      drivingLicense: req.file?.path,
    };
    const driver = await DriverServices.createDriver(payload);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Driver Created Successfully",
      data: driver,
    });
  }
);

const updateDriverStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { driverStatus } = req.body;

  const result = await DriverServices.updateDriverStatus(id, driverStatus);

  res.status(httpStatus.OK).json({
    success: true,
    message: `Driver status updated to ${driverStatus}`,
    data: result,
  });
});

const getMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const result = await DriverServices.getMe(decodedToken.userId);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Your Driver Profile Retrieved Successfully",
      data: result.data,
    });
  }
);

export const updateMyDriverProfile = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const userId = user.userId;

    const updatedData: any = {};

    // Vehicle is a nested object
    if (req.body.vehicle) {
      const vehicleData = JSON.parse(req.body.vehicle);
      if (vehicleData.vehicleNumber)
        updatedData["vehicle.vehicleNumber"] = vehicleData.vehicleNumber;
      if (vehicleData.vehicleType)
        updatedData["vehicle.vehicleType"] = vehicleData.vehicleType;
    }

    // Driving license
    if (req.file?.path) updatedData.drivingLicense = req.file.path;

    // Optional other fields
    if (req.body.onlineStatus) updatedData.onlineStatus = req.body.onlineStatus;
    if (req.body.ridingStatus) updatedData.ridingStatus = req.body.ridingStatus;

    const updatedDriver = await DriverServices.updateMyDriverProfile(
      userId,
      updatedData
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Driver profile updated successfully",
      data: updatedDriver,
    });
  }
);

const getAllDrivers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;
    const result = await DriverServices.getAllDrivers(
      query as Record<string, string>
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "All Driver Retrieved Successfully",
      data: result,
    });
  }
);
const getSingleDriver = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await DriverServices.getSingleDriver(id);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Driver Retrieved Successfully",
      data: result.data,
    });
  }
);

const goOnline = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const userId = user.userId;
  const currentLocation = req.body;
  const result = await DriverServices.goOnline(userId, currentLocation);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "You are Online Now!",
    data: result.data,
  });
});

const updateLocation = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const userId = user.userId;
  const currentLocation = req.body;
  const result = await DriverServices.updateLocation(userId, currentLocation);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Your Location Updated!",
    data: result.data,
  });
});

const goOffline = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const userId = user.userId;

  const result = await DriverServices.goOffline(userId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "You Have Became Offline Now!",
    data: result.data,
  });
});

export const DriverControllers = {
  createDriver,
  updateDriverStatus,
  getMe,
  updateMyDriverProfile,
  getSingleDriver,
  getAllDrivers,
  goOffline,
  goOnline,
  updateLocation,
};
