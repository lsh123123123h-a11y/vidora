// 加载运行环境，未指定时使用开发模式。
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "dev";
  console.log(`[环境变量：${process.env.NODE_ENV}]`);
}
