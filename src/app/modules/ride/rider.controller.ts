import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { RiderServices } from "./rider.service";
import { JwtPayload } from "jsonwebtoken";


 const createRide = catchAsync(
  async (req: Request, res: Response) => {
     const decodeToken = req.user as JwtPayload;
    const result = await RiderServices.createRideService(
      req.body,
      // (req.user as any)?._id?.toString()
      decodeToken.userId
    );
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Ride requested successfully",
      data: result,
    });
  }
);

 const cancelRide = catchAsync(
  async (req: Request, res: Response) => {
    const result = await RiderServices.cancelRideService(
      req.params.id,
      (req.user as any)?._id?.toString()
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Ride cancelled successfully",
      data: result,
    });
  }
);

 const getRideHistory = catchAsync(async (req: Request, res: Response) => {
  const result = await RiderServices.getRideHistoryService((req.user as any)?._id?.toString());
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Ride history fetched successfully",
    data: result,
  });
});

export const RiderController = {
  createRide,
  cancelRide,
  getRideHistory,
};
