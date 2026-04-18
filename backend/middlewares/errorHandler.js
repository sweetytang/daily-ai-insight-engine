export function errorHandler(error, request, response, next) {
  console.error("[api-error]", error);

  response.status(Number(error.statusCode) || 500).json({
    message: "服务执行失败，请稍后重试。",
    detail: error.message
  });

  return next?.();
}
