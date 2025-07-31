import { Types } from "mongoose";
import { IUser, Role } from "../user/user.interface";

export interface IVehicleInfo {
  type: string;
  model: string;
  plateNumber: string;
  color?: string;
}

export interface IDriver {
  role: Role.DRIVER;
  isOnline?: boolean;
  isAvailable?: boolean;
  isBlocked?: boolean;
  isSuspended?: boolean;
  isApproved?: boolean;
  totalEarnings?: number;
  vehicleInfo?: IVehicleInfo;
}
