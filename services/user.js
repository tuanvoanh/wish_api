const { JWT_SECRET, TEAM_EMAIL, BASE_URL } = require("../configs");
const JWT = require("jsonwebtoken");
const User = require("../models/User");
const emailHelper = require("../helpers/sendgrid")
const activateSubject = "Active Account Email"
const path = require("path")

module.exports = UserService = {
  signUpService: async (req, res, next) => {
    const { firstName, lastName, email, password } = req.value.body;

    // Check if there is a user with the same user
    const foundUser = await User.findOne({ email });
    if (foundUser)
      return res
        .status(403)
        .json({ error: { message: "Email is already in use." } });

    // Create a new user
    const newUser = new User({ firstName, lastName, email, password });
    newUser.save();

    // Encode a token
    const token = UserService.encodedToken(newUser._id);

    res.setHeader("Authorization", token);

    // gui sgMail
    const url = `${BASE_URL}/users/secret?token=${token}`
    const html = `<p>Hi ${firstName} ${lastName} </p>
    <p>Click <a href="${url}">here</a> to active your account</p>`
    await emailHelper.sendEmail(email, TEAM_EMAIL, activateSubject, html)
    return res.status(201).json({ success: true });
  },

  encodedToken: (userID) => {
    return JWT.sign(
      {
        iss: "Tuan Vo",
        sub: userID,
        iat: new Date().getTime(),
        exp: new Date().setDate(new Date().getDate() + 3),
      },
      JWT_SECRET
    );
  },
  forgotPassword: async (req, res, next) => {
    return res.sendFile(path.resolve("views/changePassword.html"))
  },
  newPassword: async (req, res, next) => {
    // if (req.body.password)
    pass1 = req.body.password1
    pass2 = req.body.password2
    if (pass1 == pass2 ) {
      req.user.password = pass1
      await req.user.save()
    }
    // return res.sendFile(path.resolve("views/changePassword.html")
    return res.status(200).send("Update password success")
  },
  resetPassword: async (user, token) => {
    const url = `${BASE_URL}/users/changePassword?token=${token}`
    console.log(url)
    const html = `<p>Hi ${user.firstName} ${user.lastName}</p>
    <p>Click <a href="${url}">here</a> to create your new password</p>`
    await emailHelper.sendEmail(user.email, TEAM_EMAIL, "Reset Password", html)
  }
};
