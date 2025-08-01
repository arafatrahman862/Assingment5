import { Request, Response } from "express";
import httpStatus from "http-status-codes";

import { sendResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";
import { DriverService } from "./driver.service";

import mongoose from "mongoose";
import AppError from "../../errorHelpers/AppError";

const setAvailability = catchAsync(async (req: Request, res: Response) => {
  const isDriverOnline = await DriverService.toggleDriverAvailability(
    (req.user as any)!.userId?.toString(),
    req.body?.isOnline
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.ACCEPTED,
    message: `Driver is now ${isDriverOnline.isOnline ? "Online" : "Offline"}`,
    data: isDriverOnline,
  });
});

const approveDriverController = catchAsync(
  async (req: Request, res: Response) => {
    const driverId = req.params.id;

    const result = await DriverService.approveDriverService(driverId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Driver approved successfully",
      data: result,
    });
  }
);

const changeRideStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params; 
  const { status } = req.body;

  
  if (!status) {
    throw new AppError(httpStatus.BAD_REQUEST, "Status is required");
  }

  const result = await DriverService.updateRideStatus(
    id,
    status
  );
 
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Driver status changed Successfully",
    data: result,
  });
});

const viewEarnings = catchAsync(async (req: Request, res: Response) => {
  const earnings = await DriverService.getDriverEarnings(
    (req.user as any)?._id?.toString()
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Earnings retrieved",
    data: earnings,
  });
});

const acceptRideRequest = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const userId = new mongoose.Types.ObjectId((req.user as any)?.userId);
  const updatedBooking = await DriverService.acceptRideRequestService(
    payload,
    userId
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Ride accepted successfully",
    data: updatedBooking,
  });
});
const rejectDriverController = catchAsync(
  async (req: Request, res: Response) => {
   const { id: driverId } = req.params;
    const result = await DriverService.rejectDriver(driverId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Driver rejected successfully",
      data: result,
    });
  }
);

// const updateDriverProfile = catchAsync(async (req: Request, res: Response) => {
//   // const payload = req.body;
//   const { id } = req.params;
//   console.log(id)
//  const payload = req.body;
//   const updatedDriver = await DriverService.updateDriverProfileService(
//     // payload,
//     // (req.user as any)?._id?.toString(),
//     id,
//     payload,
//   );
//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.OK,
//     message: "Driver profile updated",
//     data: updatedDriver,
//   });
// });

const suspendDriverController = catchAsync(
  async (req: Request, res: Response) => {
    const driverId = req.params.id;
    const result = await DriverService.suspendDriver(driverId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Driver suspended successfully",
      data: result,
    });
  }
);

const promoteToDriverController = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.params.id;
    const result = await DriverService.promoteToDriver(req.body, userId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User promoted to driver successfully",
      data: result,
    });
  }
);



export const DriverControllers = {
  setAvailability,
  viewEarnings,
  changeRideStatus,
  // updateDriverProfile,
  acceptRideRequest,
  approveDriverController,
  suspendDriverController,
  rejectDriverController,
  promoteToDriverController,
};
