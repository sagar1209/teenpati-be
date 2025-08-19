"use strict";
import nodemailer from "nodemailer";
import { ENV_VARIABLE } from "../constants/envVariable.constant.js";

const transporter = nodemailer.createTransport({
    host: ENV_VARIABLE.SMTP_HOST,
    port: ENV_VARIABLE.SMTP_PORT,
    secure: ENV_VARIABLE.SMTP_PORT == 465,
    auth: {
        user: ENV_VARIABLE.SMTP_USERNAME,
        pass: ENV_VARIABLE.SMTP_PASSWORD
    }
});

const sendMailAsync = (data) => {
    const mailOptions = {
        from: `"${ENV_VARIABLE.MAIL_FROM_NAME}" <${ENV_VARIABLE.MAIL_FROM_ADDRESS}>`,
        to: data.email,
        cc: data?.cc || "",
        subject: data.subject,
        html: data.body,
        attachments : data.attachments ?? []
    };

    transporter.sendMail(mailOptions)
        .then((info) => {
            console.log("Email sent:", info.response);
        })
        .catch((error) => {
            console.error("Error sending email:", error);
        });

    return { success: true, message: "Email queued for sending" };
}

const sendMail = async (data) => {
    const mailOptions = {
        from: `"${ENV_VARIABLE.MAIL_FROM_NAME}" <${ENV_VARIABLE.MAIL_FROM_ADDRESS}>`,
        to: data.email,
        cc: data?.cc || "",
        subject: data.subject,
        html: data.body,
        attachments : data.attachments ?? []
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.response);
        return { success: true, response: info.response };
    } catch (error) {
        console.error("Error sending email:", error);
        // throw error;
    }
};

export { sendMail , sendMailAsync};