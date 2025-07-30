import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import {
  toggleDriverAvailability,
  updateRideStatus,
  getDriverEarnings,
} from "../driver/driver.service";
import { sendResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";

 const setAvailability = catchAsync(async (req: Request, res: Response) => {
  
    const isDriverOnline = await toggleDriverAvailability(
      req.user.id,
      req.body.online
    );
     sendResponse(res, {
        success: true,
        statusCode: httpStatus.ACCEPTED,
        message: "Driver is Online",
        data: isDriverOnline,
    })
  
})

 const changeRideStatus = catchAsync(async (req: Request, res: Response) => {
   const status = await updateRideStatus(req.params.id, req.body.status);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Driver status changed Successfully",
    data: status,
  });
   
 });

 const viewEarnings = catchAsync(async (req: Request, res: Response) => {
  
     const earnings = await getDriverEarnings(req.user.id);
     sendResponse(res, {
       success: true,
       statusCode: httpStatus.CREATED,
       message: "View Driver Earnings",
       data: earnings,
     });
 });


export const DriverControllers = {
  setAvailability,
  viewEarnings,
  changeRideStatus,
};