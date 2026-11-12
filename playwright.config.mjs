import { defineConfig, devices } from "@playwright/test";

const SAMPLE_PORT = 3100;
const PLAIN_PORT = 3101;
const noUpstash = {
  UPSTASH_REDIS_REST_URL: "",
  UPSTASH_REDIS_REST_TOKEN: "",
  KV_REST_API_URL: "",
  KV_REST_API_TOKEN: "",
};

export default defineConfig({
  testDir: "e2e",
  timeout: 180000,
  expect: { timeout: 30000 },
  workers: 1,
  reporter: [["list"]],
  use: { ...devices["Desktop Chrome"] },
  projects: [
    { name: "sample", testMatch: /insights\.spec\.js/, use: { baseURL: `http://localhost:${SAMPLE_PORT}` } },
    { name: "plain", testMatch: /game\.spec\.js/, use: { baseURL: `http://localhost:${PLAIN_PORT}` } },
  ],
  webServer: [
    {
      command: `npx next start -p ${SAMPLE_PORT}`,
      url: `http://localhost:${SAMPLE_PORT}/api/get-distribution`,
      stdout: "pipe",
      env: { ...noUpstash, GTP_SAMPLE_DATA: "1" },
      reuseExistingServer: false,
      timeout: 180000,
    },
    {
      command: `npx next start -p ${PLAIN_PORT}`,
      url: `http://localhost:${PLAIN_PORT}/api/get-distribution`,
      stdout: "pipe",
      env: { ...noUpstash, GTP_SAMPLE_DATA: "" },
      reuseExistingServer: false,
      timeout: 180000,
    },
  ],
});
