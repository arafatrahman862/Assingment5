import { envVars } from "../config/env";
import { IAuthProvider, IUser, RiderStatus, Role } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import bcryptjs from "bcryptjs";


export const seedAdmin = async () => {
  try {
    const isAdminExist = await User.findOne({
      email: envVars.ADMIN_EMAIL,
    });

    if (isAdminExist) {
      console.log("Admin Already Exists!");
      return;
    }

    console.log("Trying to create Admin...");

    const hashedPassword = await bcryptjs.hash(
      envVars.ADMIN_PASSWORD,
      Number(envVars.BCRYPT_SALT_ROUND)
    );


    const authProvider: IAuthProvider = {
      provider: "credentials",
      providerId: envVars.ADMIN_EMAIL,
    };

    const payload: IUser = {
      name: "admin",
      role: Role.ADMIN,
      email: envVars.ADMIN_EMAIL,
      password: hashedPassword,
      isVerified: true,
      riderStatus: RiderStatus.IDLE,
      auths: [authProvider],
    };

    const Admin = await User.create(payload);
    console.log("Admin Created Successfully! \n");

      if (envVars.NODE_ENV === "development") {
        console.log(Admin);
      }
  } catch (error) {
    if (envVars.NODE_ENV === "development") {
      console.log(error);
    }
  }
};
