import "dotenv/config";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import Author from "../models/Author.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) {
          return done(null, false);
        }
        let author = await Author.findOne({ googleId: profile.id });
        if (!author) {
          const existingAuthor = await Author.findOne({ email });
          if (existingAuthor) {
            return done(null, false);
          }
          author = await Author.create({
            nome: profile.name?.givenName || profile.displayName || "Google",
            cognome: profile.name?.familyName || "User",
            email,
            googleId: profile.id,
            avatar: profile.photos?.[0]?.value || "",
          });
        }
        return done(null, author);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

export default passport;
