import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { BOOKING_STATUS, IBooking } from "./booking.interface";
import httpStatus from "http-status-codes";
import { Booking } from "./booking.model";


export const createBooking = async (payload: Partial<IBooking>, userId: string) => {
try {
    const user = await User.findById(userId);

      if (!user?.phone || !user.address) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Please Update Your Profile to Book a Tour."
        );
      }

        const booking = await Booking.create(
          
            {
              user: userId,
              status: BOOKING_STATUS.REQUESTED,
              ...payload,
            },
        
        );
} catch (error) {
    
}
};