import { Types } from "mongoose";
import {  Role } from "../user/user.interface";

export interface IVehicleInfo {
  type: string;
  model: string;
  plateNumber: string;
  color?: string;
}
export enum DRIVER_STATUS {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  SUSPENDED = "SUSPENDED",
  REJECTED = "REJECTED",
}

export interface IDriver {
  user?: Types.ObjectId;
  email?: string;
  role: Role.DRIVER;
  isOnline?: boolean;
  isAvailable?: boolean;
  isBlocked?: boolean;
  isSuspended?: boolean;
  isApproved?: boolean;
  totalEarnings?: number;
  vehicleInfo?: IVehicleInfo;
  // status?: string;
  status: DRIVER_STATUS;
}
