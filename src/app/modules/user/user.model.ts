import { model, Schema } from "mongoose";
import { IAuthProvider, IsBlocked, IUser, RiderStatus, Role } from "./user.interface";


const authProviderSchema = new Schema<IAuthProvider>(
  {
    provider: { type: String, required: true },
    providerId: { type: String, required: true },
  },
  {
    versionKey: false,
    _id: false,
  }
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.RIDER,
    },
    phone: { type: String },
    picture: { type: String },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number, Number],
      },
    },
    isDeleted: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    isBlocked: {
      type: String,
      enum: Object.values(IsBlocked),
      default: IsBlocked.UNBLOCKED,
    },
    riderStatus: {
      type: String,
      enum: Object.values(RiderStatus),
      default: RiderStatus.IDLE,
    },
    // isVerified: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: true },
    auths: [authProviderSchema],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const User = model<IUser>("User", userSchema);