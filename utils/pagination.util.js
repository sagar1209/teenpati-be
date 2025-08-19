

const { Op } = require('sequelize');


const getPagination = (page, rows) => {
  const limit = rows > 0 ? rows : 10;
  const offset = page > 0 ? (page - 1) * limit : 0;
  return { limit, offset };
};


module.exports = {
  getPagination
}
