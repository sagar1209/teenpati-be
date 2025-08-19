const Joi = require("joi");
const { sendErrorResponse } = require("./response.util");

const validateSchema = (schema, data) => {
    return schema.validate(data);
};

module.exports = {
    validateSchema
}