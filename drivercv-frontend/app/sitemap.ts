import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://driverall.com";

  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/jobs`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/packages`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/register/auth`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];
}
