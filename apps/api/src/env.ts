import { readRuntimeConfig } from "./runtimeConfig";

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "dev";
  console.log(`[环境变量：${process.env.NODE_ENV}]`);
}

export const runtimeConfig = readRuntimeConfig(process.env, process.cwd());
export { readRuntimeConfig };
