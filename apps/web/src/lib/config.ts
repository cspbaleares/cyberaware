export const appConfig = {
  appName: "CyberAware Suite",
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:3001",
};
