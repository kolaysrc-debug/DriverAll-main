// DriverAll-main/drivercv-frontend/lib/api/cv.ts

import { apiFetch } from "@/lib/api/_core";

export type CvValues = Record<string, any>;

export type CvResponse = {
  _id?: string;
  userId?: string;
  values: CvValues;
};

export async function getCv(): Promise<CvResponse | null> {
  try {
    const data = await apiFetch("/api/cv");
    const cv = (data as any).cv;
    return (cv || null) as CvResponse | null;
  } catch (err: any) {
    // Login yoksa 401 alırız, bunu "CV yok" gibi düşünelim
    if (err.message && err.message.includes("Yetkisiz")) {
      return null;
    }
    throw err;
  }
}

export async function saveCv(values: CvValues): Promise<CvResponse> {
  const data = await apiFetch("/api/cv", {
    method: "PUT",
    body: JSON.stringify({ values }),
  });

  return (data as any).cv as CvResponse;
}
