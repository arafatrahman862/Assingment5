import { Types } from "mongoose";
import {  Role } from "../user/user.interface";

export enum BOOKING_STATUS_RIDER {
  PENDING = "PENDING",
  CANCEL = "CANCEL",
  COMPLETE = "COMPLETE",
  FAILED = "FAILED",
  REQUESTED = "REQUESTED",
  CANCELLED = "CANCELLED"
}

export interface IRider {
  user: Types.ObjectId;
  role: Role.RIDER;
  bookings?: Types.ObjectId[];
  pickup: string;
  destination_location: string;
  rideHistory?: Types.ObjectId[];
  payment?: Types.ObjectId;
  status: BOOKING_STATUS_RIDER;
  createdAt?: Date;
}
