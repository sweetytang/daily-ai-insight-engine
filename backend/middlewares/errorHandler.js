export function errorHandler(error, request, response, next) {
  console.error("[api-error]", error);

  response.status(500).json({
    message: "服务执行失败，请先确认数据库已初始化并完成种子数据导入。",
    detail: error.message
  });

  return next;
}
