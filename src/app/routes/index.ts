import { Router } from "express";
import { UserRoutes } from "../modules/user/user.route";
import { AuthRoutes } from "../modules/auth/auth.route";
import { DriverRoutes } from "../modules/driver/driver.route";
import { BookingRoutes } from "../modules/booking/booking.route";
import { RiderRoutes } from "../modules/ride/rider.route";

export const router = Router();

const moduleRoutes = [
  {
    path: "/users",
    route: UserRoutes,
  },
  
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/rides",
    route: RiderRoutes,
  },
  {
    path: "/drivers",
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

