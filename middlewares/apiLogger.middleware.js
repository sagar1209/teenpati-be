const apiLogger = (req, res, next) => {
    const { method, originalUrl, body, query, params } = req;
    const startTime = new Date();
  
    const finish = () => {
      const endTime = new Date();
      const responseTime = endTime - startTime;
  
      const logMessage = {
        timestamp: startTime.toISOString(),
        method,
        originalUrl,
        body,
        query,
        params,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
      };
  
      console.info(`${logMessage.method} ${logMessage.originalUrl}`, logMessage.statusCode, `${responseTime}ms`)
    };
    res.once('finish', finish);
    next();
  }
  
  module.exports = apiLogger