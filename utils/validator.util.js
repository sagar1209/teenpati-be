const Joi = require("joi");
const { ApiError } = require("./apiError.util");

const validateSchema = (schema, data) => {
    const { error, value } = schema.validate(data);
    if(error){
        throw new ApiError(error.details[0].message, 400);
    }
    return value;
};

module.exports = {
    validateSchema
}