import path from "path";
import isPathInside from "is-path-inside";
import { readRuntimeConfig } from "../runtimeConfig";

export default (fileName?: string[] | string) => {
  const basePath = readRuntimeConfig(process.env, process.cwd()).dataDir;
  if (fileName) {
    let dbPath: string;
    if (Array.isArray(fileName)) {
      dbPath = path.resolve(basePath, ...fileName);
    } else {
      dbPath = path.resolve(basePath, fileName);
    }
    if (!isPathInside(dbPath, basePath) && dbPath !== basePath) {
      throw new Error("路径逃逸错误，路径必须在数据目录内");
    }
    return dbPath;
  }
  return basePath;
};
