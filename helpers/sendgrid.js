const {SENDGRID_API_KEY} = require("../configs")
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(SENDGRID_API_KEY);

const sendEmail = async (to, from, subject, html) => {

    const msg = {
        to: to,
        from: from, // Use the email address or domain you verified above
        subject: subject,
        html: html,
    };
    try {
        return await sgMail.send(msg)
    } catch (error) {
        console.error(error);

        if (error.response) {
            console.error(error.response.body);
        }
    }
};


module.exports = {
    sendEmail
}