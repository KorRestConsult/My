import { refreshState } from "./lib/zhkh-core.mts";

export default async () => {
  try {
    await refreshState("scheduled");
  } catch (error) {
    console.error("Scheduled ZHKH refresh failed", error);
  }
};

export const config = {
  schedule: "30 6 * * *",
};
