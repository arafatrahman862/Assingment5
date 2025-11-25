/* eslint-disable no-console */
import axios from "axios";

export const calculateDistanceAndFare = async (
  pickup: [number, number],
  destination: [number, number],
  baseFarePerKm = 100
) => {
  try {
    // OSRM API call (free)
    const url = `https://router.project-osrm.org/route/v1/driving/${pickup[0]},${pickup[1]};${destination[0]},${destination[1]}?overview=false`;
    const res = await axios.get(url);

    if (!res.data.routes || res.data.routes.length === 0) {
      throw new Error("No route found");
    }

    const route = res.data.routes[0];
    const distanceInMeters = route.distance;
    const distanceKm = parseFloat((distanceInMeters / 1000).toFixed(2));
    const fare = parseFloat((distanceKm * baseFarePerKm).toFixed(2));

    return {
      distanceKm,
      fare,
    };
  } catch (err) {
    console.error(err);
    return { distanceKm: 0, fare: 0 };
  }
};
