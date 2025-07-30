import { Router } from "express";
import { UserRoutes } from "../modules/user/user.route";
import { AuthRoutes } from "../modules/auth/auth.route";
import { DriverRoutes } from "../modules/driver/driver.route";
import { BookingRoutes } from "../modules/booking/booking.route";

export const router = Router();

const moduleRoutes = [
  {
    path: "/user",
    route: UserRoutes,
  },
  
  {
    path: "/auth",
    route: AuthRoutes,
  },
//   {
//     path: "/rider",
//     route: RiderRoutes,
//   },
  {
    path: "/driver",
    route: DriverRoutes,
  },
  {
    path: "/booking",
    route: BookingRoutes,
  },


];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

