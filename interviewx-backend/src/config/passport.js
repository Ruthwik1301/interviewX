import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "./env.js";
import { User } from "../models/User.js";
import { signToken } from "../middleware/auth.js";

export function configurePassport() {
  if (!env.googleClientId || !env.googleClientSecret) {
    console.warn(
      "[passport] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set — Google OAuth disabled.",
    );
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.googleClientId,
        clientSecret: env.googleClientSecret,
        callbackURL: env.googleCallbackUrl,
        scope: ["profile", "email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) {
            return done(new Error("No email returned from Google"), null);
          }

          // Find existing user or create a new one
          let user = await User.findOne({ email });

          if (user) {
            // If they registered with email/password before, link their Google account
            // and mark email as verified (Google already verified it)
            if (!user.emailVerified) {
              user.emailVerified = true;
              user.verifyToken = null;
              user.verifyTokenExpiry = null;
              await user.save();
            }
          } else {
            // Brand new user via Google — create account
            user = new User({
              name: profile.displayName || email.split("@")[0],
              email,
              emailVerified: true, // Google has already verified this email
              // No password — they use Google to log in
              // We still need a passwordHash field (required), so set a random unusable one
              passwordHash: `google_oauth_${profile.id}`,
            });
            await user.save();
          }

          const token = signToken(user._id.toString());
          return done(null, { token, user: user.toPublicJSON() });
        } catch (err) {
          return done(err, null);
        }
      },
    ),
  );
}
