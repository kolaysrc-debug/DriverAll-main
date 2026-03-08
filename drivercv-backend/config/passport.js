// OAuth stratejileri: Google, Apple, Microsoft, Yandex
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const AppleStrategy = require("passport-apple");
const MicrosoftStrategy = require("passport-microsoft").Strategy;
const YandexStrategy = require("passport-yandex").Strategy;
const User = require("../models/User");

// Kullanıcı serialize/deserialize (session için - opsiyonel)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// ============================================
// GOOGLE OAuth Strategy
// ============================================
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3001/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Email'i al
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("Google hesabında email bulunamadı"), null);
          }

          // Kullanıcı var mı kontrol et
          let user = await User.findOne({ email });

          if (!user) {
            // Yeni kullanıcı oluştur
            user = new User({
              email,
              name: profile.displayName || email.split("@")[0],
              // phone alanını hiç set etme - MongoDB default değeri kullanacak
              role: "driver", // varsayılan rol
              authProvider: "google",
              authProviderId: profile.id,
              emailVerified: true, // Google'dan geldiği için doğrulanmış
              passwordHash: "oauth-no-password", // OAuth kullanıcıları için dummy hash
            });
            await user.save();
          } else {
            // Mevcut kullanıcı - provider bilgisini güncelle
            if (!user.authProvider) {
              user.authProvider = "google";
              user.authProviderId = profile.id;
              user.emailVerified = true;
              await user.save();
            }
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}

// ============================================
// APPLE OAuth Strategy
// ============================================
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY_PATH) {
  passport.use(
    new AppleStrategy(
      {
        clientID: process.env.APPLE_CLIENT_ID,
        teamID: process.env.APPLE_TEAM_ID,
        keyID: process.env.APPLE_KEY_ID,
        privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH,
        callbackURL: process.env.APPLE_CALLBACK_URL || "http://localhost:3001/api/auth/apple/callback",
        passReqToCallback: false,
      },
      async (accessToken, refreshToken, idToken, profile, done) => {
        try {
          const email = profile.email;
          if (!email) {
            return done(new Error("Apple hesabında email bulunamadı"), null);
          }

          let user = await User.findOne({ email });

          if (!user) {
            user = new User({
              email,
              name: profile.name?.firstName ? `${profile.name.firstName} ${profile.name.lastName || ""}`.trim() : email.split("@")[0],
              role: "driver",
              authProvider: "apple",
              authProviderId: profile.sub,
              emailVerified: true,
              passwordHash: "oauth-no-password",
            });
            await user.save();
          } else {
            if (!user.authProvider) {
              user.authProvider = "apple";
              user.authProviderId = profile.sub;
              user.emailVerified = true;
              await user.save();
            }
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}

// ============================================
// MICROSOFT OAuth Strategy
// ============================================
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(
    new MicrosoftStrategy(
      {
        clientID: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        callbackURL: process.env.MICROSOFT_CALLBACK_URL || "http://localhost:3001/api/auth/microsoft/callback",
        scope: ["user.read"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value || profile.userPrincipalName;
          if (!email) {
            return done(new Error("Microsoft hesabında email bulunamadı"), null);
          }

          let user = await User.findOne({ email });

          if (!user) {
            user = new User({
              email,
              name: profile.displayName || email.split("@")[0],
              role: "driver",
              authProvider: "microsoft",
              authProviderId: profile.id,
              emailVerified: true,
              passwordHash: "oauth-no-password",
            });
            await user.save();
          } else {
            if (!user.authProvider) {
              user.authProvider = "microsoft";
              user.authProviderId = profile.id;
              user.emailVerified = true;
              await user.save();
            }
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}

// ============================================
// YANDEX OAuth Strategy
// ============================================
if (process.env.YANDEX_CLIENT_ID && process.env.YANDEX_CLIENT_SECRET) {
  passport.use(
    new YandexStrategy(
      {
        clientID: process.env.YANDEX_CLIENT_ID,
        clientSecret: process.env.YANDEX_CLIENT_SECRET,
        callbackURL: process.env.YANDEX_CALLBACK_URL || "http://localhost:3001/api/auth/yandex/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Yandex'ten email almaya çalış - farklı yollar dene
          let email = profile.emails?.[0]?.value || profile.default_email || profile._json?.default_email || profile._json?.email;
          
          // Email yoksa telefon numarasından email oluştur
          if (!email || email === "") {
            const phone = profile._json?.default_phone?.number;
            if (phone) {
              // Telefon numarasından email oluştur (örnek: +905323047271 -> 905323047271@yandex.temp)
              email = phone.replace(/\+/g, "") + "@yandex.temp";
              console.log("Yandex email yok, telefon kullanıldı:", email);
            } else {
              return done(new Error("Yandex hesabında email veya telefon bulunamadı."), null);
            }
          }

          let user = await User.findOne({ email });

          if (!user) {
            user = new User({
              email,
              name: profile.displayName || profile.real_name || email.split("@")[0],
              role: "driver",
              authProvider: "yandex",
              authProviderId: profile.id,
              emailVerified: true,
              passwordHash: "oauth-no-password",
            });
            await user.save();
          } else {
            if (!user.authProvider) {
              user.authProvider = "yandex";
              user.authProviderId = profile.id;
              user.emailVerified = true;
              await user.save();
            }
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}

module.exports = passport;
