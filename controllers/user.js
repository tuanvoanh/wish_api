const path = require("path")
const User = require("../models/User");
const UserService = require("../services/user.js");

// const authFacebook = async (req, res, next) => {
//   // Assign a token
//   const token = encodedToken(req.user._id)

//   res.setHeader('Authorization', token)
//   return res.status(200).json({ success: true })
// }

// const authGoogle = async (req, res, next) => {
//   // Assign a token
//   const token = encodedToken(req.user._id)

//   res.setHeader('Authorization', token)
//   return res.status(200).json({ success: true })
// }

const getUser = async (req, res, next) => {
  const { userID } = req.value.params;

  const user = await User.findById(userID);

  return res.status(200).json({ user });
};

const index = async (req, res, next) => {
  const users = await User.find({});

  return res.status(200).json({ users });
};

const newUser = async (req, res, next) => {
  const newUser = new User(req.value.body);
  
  await newUser.save();

  return res.status(201).json({ user: newUser });
};

const replaceUser = async (req, res, next) => {
  // enforce new user to old user
  const { userID } = req.value.params;

  const newUser = req.value.body;

  const result = await User.findByIdAndUpdate(userID, newUser);

  return res.status(200).json({ success: true });
};

const secret = async (req, res, next) => {
  await User.updateOne({_id: req.user.id}, {isActive: true})
  return res.sendFile(path.resolve("views/activeSuccess.html"))
};

const signIn = async (req, res, next) => {
  // Assign a token
  const token = UserService.encodedToken(req.user._id)

  res.setHeader('Authorization', token)
  return res.status(200).json({ token, role: req.user.role })
};

const signUp = async (req, res, next) => {
  UserService.signUpService(req, res, next)
};

const forgotPassword = async (req, res, next) => {
  UserService.forgotPassword(req, res, next)
}

const newPassword = async (req, res, next) => {
  UserService.newPassword(req, res, next)
}

const resetPassword = async (req, res, next) => {
  const {email} = req.body
  const user = await User.findOne({email: email})
  if (user) {
    const token = UserService.encodedToken(user._id)
    UserService.resetPassword(user, token)
  }
  res.status(200).json({ success: true})
}

const updateUser = async (req, res, next) => {
  // number of fields
  const { userID } = req.value.params;

  const newUser = req.value.body;

  const result = await User.findByIdAndUpdate(userID, newUser);

  return res.status(200).json({ success: true });
};

const changUserPass = async (req, res, next) => {
  // number of fields
  const { password, email } = req.value.body;
  
  const user = await User.findOne({email: email});
  if (!user) {
    throw new Error("This email does not exist")
  }
  user.password = password
  
  await user.save()

  return res.status(200).json({ success: true });
};

const getAllUser = async (req, res, next) => {
  const limit = req.value.query.limit;
  const page = req.value.query.page;
  const s_email = req.value.query.s_email;
  const skip = page * limit;
  const cond = {}
  if (s_email) {
    cond["email"] = { "$regex": `.*${s_email}.*` }
  }
  const listUser = await User.find(cond).select("-password")
    .skip(skip)
    .limit(limit);
  const totalUser = await User.find({}).count();
  return res.status(200).json({
    total_item: totalUser,
    total_page: Math.ceil(totalUser / limit),
    per_page: limit,
    current_page: page,
    items: listUser,
  });
}

const removeUser = async (req, res, next) => {
  const { userID } = req.value.params;

  await User.deleteOne({_id: userID});

  return res.status(204).json({});
}

module.exports = {
  // authFacebook,
  // authGoogle,
  getUser,
  index,
  newUser,
  replaceUser,
  secret,
  signIn,
  signUp,
  updateUser,
  forgotPassword,
  newPassword,
  resetPassword,
  changUserPass,
  getAllUser,
  removeUser
};
