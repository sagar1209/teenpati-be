// utils/renderTemplate.js
const path = require("path");
const ejs = require("ejs");
const { ENV_VARIABLE } = require("../constants/envVariable.constant");
const renderEjsFile = async (fileName, data) => {
	const templatePath = path.join(
		__dirname,
		"../public/templates/",
		fileName
	);
	const html = await ejs.renderFile(templatePath, {
		...data,
		imgSrc: `${ENV_VARIABLE.BACKEND_URL}/api/logo/logo.png`
	});
	return html;
};

module.exports = renderEjsFile;
