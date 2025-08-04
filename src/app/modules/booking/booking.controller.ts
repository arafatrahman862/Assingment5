

import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { sendResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";
import { BookingServices } from "./booking.service";
import { JwtPayload } from "jsonwebtoken";


 const createBooking = catchAsync(async (req: Request, res: Response) => {
 const decodeToken = req.user as JwtPayload
  const booking = await BookingServices.createBookingService(
    req.body,
    decodeToken.userId
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Booking created successfully",
    data: booking,
  });
});

 const getMyBookings = catchAsync(async (req: Request, res: Response) => {
  const bookings = await BookingServices.getRideHistoryService(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req.user as any)?._id?.toString()
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Rider bookings retrieved",
    data: bookings,
  });
});

 const cancelBooking = catchAsync(async (req: Request, res: Response) => {
  const result = await BookingServices.cancelBookingService(req.params.userId, req.params.rideId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.ACCEPTED,
    message: "Booking cancelled successfully",
    data: result,
  });
});

export const BookingController = {
  createBooking,
  cancelBooking,
  getMyBookings,
};