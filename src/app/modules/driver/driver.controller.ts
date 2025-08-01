import { Request, Response } from "express";
import httpStatus from "http-status-codes";

import { sendResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";
import { DriverService } from "./driver.service";

 const setAvailability = catchAsync(async (req: Request, res: Response) => {
  
    const isDriverOnline = await DriverService.toggleDriverAvailability(
      (req.user as any)!._id?.toString(),
      req.body?.online
    );
     sendResponse(res, {
       success: true,
       statusCode: httpStatus.ACCEPTED,
       message: `Driver is now ${isDriverOnline.isOnline ? "Online" : "Offline"}`,
       data: isDriverOnline,
     });
  
})

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
   const status = await DriverService.updateRideStatus(req.params.id, req.body.status);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Driver status changed Successfully",
    data: status,
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
  const updatedBooking = await DriverService.acceptRideRequestService(
    payload,
    (req.user as any)?._id?.toString()
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Ride accepted successfully",
    data: updatedBooking,
  });
});

const updateDriverProfile = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const updatedDriver = await DriverService.updateDriverProfileService(
    payload,
    (req.user as any)?._id?.toString()
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Driver profile updated",
    data: updatedDriver,
  });
});

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
    const result = await DriverService.promoteToDriver(req.body,userId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User promoted to driver successfully",
      data: result,
    });
  }
);

const rejectDriverController = catchAsync(
  async (req: Request, res: Response) => {
    const driverId = req.params.id;
    const result = await DriverService.rejectDriver(driverId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Driver rejected successfully",
      data: result,
    });
  }
);


export const DriverControllers = {
  setAvailability,
  viewEarnings,
  changeRideStatus,
  updateDriverProfile,
  acceptRideRequest,
  approveDriverController,
  suspendDriverController,
  rejectDriverController,
  promoteToDriverController,
};