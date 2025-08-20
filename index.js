const express = require('express');
const session = require('express-session');
const { connectDB } = require('./config/database.js');
const { ENV_VARIABLE } = require('./constants/envVariable.constant');
const router = require('./routes');
const logger = require('./utils/logger.util.js');
const cors = require('cors');
const apiLogger = require('./middlewares/apiLogger.middleware');
const path = require('path');

const app = express();

app.use(cors());

app.use(express.json());
app.use(
  session({
    secret: ENV_VARIABLE.JWT_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(apiLogger);
app.use('/api/images', express.static('./images'));

app.use('/api', router);

const PORT = ENV_VARIABLE.PORT; 

app.listen(PORT, async () => {
  try {
    await connectDB();
    logger.info('server is running on port:' + PORT + ` ::URL:: http://localhost:${PORT}`);
  } catch (error) {
    logger.error('Error connecting to the database: ', error);
    process.exit(1);
  }
});


