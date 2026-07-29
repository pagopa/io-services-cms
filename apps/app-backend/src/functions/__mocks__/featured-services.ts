import { InternalFeaturedServices } from "../featured-services";

export const mockFeaturedServices = {
  services: [
    {
      age: { max: 18, min: 14 },
      id: "s1ServiceId",
      name: "S1 - suitable for minors",
      version: 1,
    },
    {
      id: "s2ServiceId",
      name: "S2 - no age",
      version: 1,
    },
    {
      age: { max: 999, min: 18 },
      id: "s3ServiceId",
      name: "S3 - adults only",
      version: 1,
    },
  ],
} as unknown as InternalFeaturedServices;
