const User = require("../models/User");
const config = require("../configs");
const enumRole = require("../enums").eROLE
const createAdmin = async () => {
  const admin = await User.findOne({ email: config.ADMIN_ACCOUNT });
  if (!admin) {
    const newAdmin = new User({
      firstName: "Admin",
      lastName: "ADMIN",
      email: config.ADMIN_ACCOUNT,
      password: config.ADMIN_PASS,
      role: enumRole.admin
    });
    newAdmin.save();
  }
};

module.exports = {
  createAdmin,
};
