

import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { sendResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";
import { BookingServices } from "./booking.service";


 const createBooking = catchAsync(async (req: Request, res: Response) => {
  const booking = await BookingServices.createBookingService({
    ...req.body,
    user: req.user.id,
    riderId: req.user.id,
  });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Booking created successfully",
    data: booking,
  });
});

 const getMyBookings = catchAsync(async (req: Request, res: Response) => {
  const bookings = await BookingServices.getRiderBookingsService(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Rider bookings retrieved",
    data: bookings,
  });
});

 const cancelBooking = catchAsync(async (req: Request, res: Response) => {
  const result = await BookingServices.cancelBookingService(req.params.id);
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