/* eslint-disable no-console */
import axios from "axios";

export async function getAddress(lat: number, lon: number) {
  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/reverse",
      {
        params: {
          lat,
          lon,
          format: "json",
        },
        headers: {
          "User-Agent": "b5-a5-arafat-app",
        },
      }
    );

    const address = response.data.display_name;
    console.log("Address:", address);
    return address;
  } catch (error) {
    console.error("Error fetching address:", error);
  }
}
