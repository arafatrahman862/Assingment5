import bcryptjs from "bcryptjs";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { IAuthProvider, IUser, Role } from "./user.interface";
import { User } from "./user.model";
import { userSearchableFields } from "./user.constant";
import { deleteImageFromCloudinary } from "../../config/cloudinary.config";

const createUser = async (payload: Partial<IUser>) => {
  const { email, password, ...rest } = payload;

  const isUserExist = await User.findOne({ email });

  if (isUserExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "User Already Exist");
  }

  const hashedPassword = await bcryptjs.hash(
    password as string,
    Number(envVars.BCRYPT_SALT_ROUND)
  );

  const authProvider: IAuthProvider = {
    provider: "credentials",
    providerId: email as string,
  };

  const user = await User.create({
    email,
    password: hashedPassword,
    auths: [authProvider],
    ...rest,
  });

  return user;
};

const updateUser = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload
) => {
  if (decodedToken.role === Role.RIDER || decodedToken.role === Role.DRIVER) {
    if (userId !== decodedToken.userId) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
    }
  }

  const ifUserExist = await User.findById(userId);

  if (!ifUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }

  if (payload.role) {
    if (decodedToken.role === Role.RIDER || decodedToken.role === Role.DRIVER) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
    }
  }

  if (payload.isBlocked || payload.isDeleted || payload.isVerified) {
    if (decodedToken.role === Role.RIDER || decodedToken.role === Role.DRIVER) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
    }
  }

   if (payload.picture) {
     if (ifUserExist.picture) {
       await deleteImageFromCloudinary(ifUserExist.picture);
     }
   }

  const newUpdatedUser = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  });

  return newUpdatedUser;
};

const getAllUsers = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(User.find(), query);
  const usersData = queryBuilder
    .filter()
    .search(userSearchableFields)
    .sort()
    .fields()
    .dateSearch()
    .paginate();

  const [data, meta] = await Promise.all([
    usersData.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};
const getSingleUser = async (id: string) => {
  const user = await User.findById(id).select("-password");
  return {
    data: user,
  };
};
const getMe = async (userId: string) => {
  const user = await User.findById(userId).select("-password");
  return {
    data: user,
  };
};

const updateUserStatus = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload
) => {
  const ifUserExist = await User.findById(userId);

  if (!ifUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (decodedToken.userId.toString() === ifUserExist._id.toString()) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You cannot change your own block status"
    );
  }

  if (payload.isBlocked === ifUserExist.isBlocked) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `User is already ${payload.isBlocked ? "blocked" : "unblocked"}`
    );
  }

  const updatedUser = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  });

  return updatedUser;
};

export const UserServices = {
  createUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  getMe,
  updateUserStatus,
};
