const twilio = require("twilio");

const otpCreds = require("../credentials");

async function resolveTwilioCreds(credentialRef) {
  const ref = String(credentialRef || "default").trim() || "default";

  const fromDb = await otpCreds.getCredential("twilioVerify", ref);
  if (fromDb?.accountSid && fromDb?.authToken && fromDb?.verifyServiceSid) {
    return fromDb;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials missing (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN or admin otp-credentials)");
  }
  if (!verifyServiceSid) {
    throw new Error("Twilio Verify Service SID missing (TWILIO_VERIFY_SERVICE_SID or admin otp-credentials)");
  }

  return { accountSid, authToken, verifyServiceSid, ref: "env" };
}

async function sendOtp({ to, channel, credentialRef }) {
  const creds = await resolveTwilioCreds(credentialRef);
  const client = twilio(creds.accountSid, creds.authToken);
  const serviceSid = creds.verifyServiceSid;

  const ch = String(channel || "").trim().toLowerCase();
  if (!ch || !["sms", "whatsapp"].includes(ch)) {
    throw new Error("Invalid channel for Twilio Verify");
  }

  const res = await client.verify.v2
    .services(serviceSid)
    .verifications.create({ to, channel: ch });

  return {
    providerRequestId: res.sid,
    raw: res,
  };
}

async function checkOtp({ to, code, credentialRef }) {
  const creds = await resolveTwilioCreds(credentialRef);
  const client = twilio(creds.accountSid, creds.authToken);
  const serviceSid = creds.verifyServiceSid;

  const res = await client.verify.v2
    .services(serviceSid)
    .verificationChecks.create({ to, code });

  return {
    status: res.status,
    raw: res,
  };
}

module.exports = {
  sendOtp,
  checkOtp,
};
