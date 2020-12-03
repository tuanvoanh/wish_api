const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const LocalStrategy = require("passport-local").Strategy;
const headerStrategy = require("passport-http-header-strategy").Strategy;
const { ExtractJwt } = require("passport-jwt");
const { JWT_SECRET, auth } = require("../configs");

const User = require("../models/User");

// Passport Jwt
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken("Authorization"),
      secretOrKey: JWT_SECRET,
    },
    async (payload, done) => {
      try {
        const user = await User.findById(payload.sub);

        if (!user) return done(null, false);

        done(null, user);
      } catch (error) {
        done(error, false);
      }
    }
  )
);

passport.use(
  "body-jwt",
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromUrlQueryParameter("token"),
      secretOrKey: JWT_SECRET,
    },
    async (payload, done) => {
      try {
        const user = await User.findById(payload.sub);

        if (!user) return done(null, false);

        done(null, user);
      } catch (error) {
        done(error, false);
      }
    }
  )
);

passport.use(
  "token_query-jwt",
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromUrlQueryParameter("token"),
      secretOrKey: JWT_SECRET,
    },
    async (payload, done) => {
      try {
        const user = await User.findById(payload.sub);

        if (!user) return done(null, false);

        done(null, user);
      } catch (error) {
        done(error, false);
      }
    }
  )
);

// Passport local
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email });
        if (!user) return done(null, false);
        const isCorrectPassword = await user.isValidPassword(password);
        if (!isCorrectPassword) throw new Error("Invalid Password");
        done(null, user);
      } catch (error) {
        done(error, false);
      }
    }
  )
);

passport.use(
  new headerStrategy({ header: "API-KEY", passReqToCallback: true }, function (
    req,
    token,
    done
  ) {
    User.findOne({ _id: token, isActive: true }, function (err, user) {
      if (err) {
        return done(null, false);
      }
      if (!user) {
        return done(null, false);
      }
      return done(null, user, { scope: "all" });
    });
  })
);

module.exports.customAuth = [
  (req, res, next) => {
    if (req.headers["api-key"]) {
      passport.authenticate("header", function (err, user, info) {
        if (user) req.user = user;
        next();
      })(req, res, next);
    } else {
      next();
    }
  },
  (req, res, next) => {
    if (!req.user && req.headers["authorization"]) {
      passport.authenticate("jwt", function (err, user, info) {
        if (user) req.user = user;
        next();
      })(req, res, next);
    } else {
      next();
    }
  },
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    next();
  },
];