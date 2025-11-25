import { Router } from "express";
import { UserRoutes } from "../modules/user/user.route";
import { AuthRoutes } from "../modules/auth/auth.route";
import { DriverRoutes } from "../modules/driver/driver.route";
import { BookingRoutes } from "../modules/booking/booking.route";
import { StatsRoutes } from "../modules/stats/stats.route";
import { PaymentRoutes } from "../modules/payment/payment.route";
import { FaqRoutes } from "../modules/faq/faq.route";
import { RideRoutes } from "../modules/ride/rider.route";

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
    route: RideRoutes
    ,
  },
  {
    path: "/drivers",
    route: DriverRoutes,
  },
  {
    path: "/booking",
    route: BookingRoutes,
  },
  {
    path: "/stats",
    route: StatsRoutes,
  },
  {
    path: "/payment",
    route: PaymentRoutes,
  },
  {
    path: "/faq",
    route: FaqRoutes,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

