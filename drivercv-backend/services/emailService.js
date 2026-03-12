// PATH: drivercv-backend/services/emailService.js
// ----------------------------------------------------------
// Merkezi email servisi — nodemailer ile SMTP
// Env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
// ----------------------------------------------------------

const nodemailer = require("nodemailer");

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("[emailService] SMTP env vars missing — emails will be logged only");
    return null;
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return _transporter;
}

const FROM = () => process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@driverall.com";

/**
 * Genel email gönder
 */
async function sendMail({ to, subject, html, text }) {
  const transporter = getTransporter();

  const mailOptions = {
    from: FROM(),
    to,
    subject,
    html: html || undefined,
    text: text || undefined,
  };

  if (!transporter) {
    console.log("[emailService] (dev-mode) Would send email:", { to, subject });
    return { accepted: [to], messageId: "dev-log" };
  }

  const info = await transporter.sendMail(mailOptions);
  console.log("[emailService] Sent:", info.messageId, "to:", to);
  return info;
}

// ----------------------------------------------------------
// Hazır şablonlar
// ----------------------------------------------------------

/** Ödeme onaylandı bildirimi */
async function notifyPaymentApproved({ to, userName, orderId, packageName }) {
  return sendMail({
    to,
    subject: "DriverAll — Ödemeniz Onaylandı ✓",
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
        <h2 style="color:#10b981">Ödemeniz Onaylandı</h2>
        <p>Merhaba <strong>${userName || "Kullanıcı"}</strong>,</p>
        <p>Sipariş <strong>#${orderId}</strong> için gönderdiğiniz ödeme onaylanmıştır.</p>
        ${packageName ? `<p>Paket: <strong>${packageName}</strong></p>` : ""}
        <p>Artık paketinizdeki kredileri kullanabilirsiniz.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
        <p style="font-size:12px;color:#94a3b8">DriverAll • Sürücü Platformu</p>
      </div>
    `,
  });
}

/** İlan onaylandı bildirimi */
async function notifyJobApproved({ to, userName, jobTitle }) {
  return sendMail({
    to,
    subject: "DriverAll — İlanınız Yayınlandı ✓",
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
        <h2 style="color:#10b981">İlanınız Yayınlandı</h2>
        <p>Merhaba <strong>${userName || "Kullanıcı"}</strong>,</p>
        <p><strong>${jobTitle || "İlanınız"}</strong> başarıyla onaylanmış ve yayına alınmıştır.</p>
        <p>Adaylar artık ilanınıza başvurabilir.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
        <p style="font-size:12px;color:#94a3b8">DriverAll • Sürücü Platformu</p>
      </div>
    `,
  });
}

/** İlan reddedildi bildirimi */
async function notifyJobRejected({ to, userName, jobTitle, reason }) {
  return sendMail({
    to,
    subject: "DriverAll — İlan Talebi Reddedildi",
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
        <h2 style="color:#ef4444">İlan Talebi Reddedildi</h2>
        <p>Merhaba <strong>${userName || "Kullanıcı"}</strong>,</p>
        <p><strong>${jobTitle || "İlanınız"}</strong> ile ilgili talebiniz reddedilmiştir.</p>
        ${reason ? `<p>Sebep: <em>${reason}</em></p>` : ""}
        <p>Düzenleme yaparak yeniden gönderebilirsiniz.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
        <p style="font-size:12px;color:#94a3b8">DriverAll • Sürücü Platformu</p>
      </div>
    `,
  });
}

/** Yeni başvuru bildirimi (employer'a) */
async function notifyNewApplication({ to, userName, jobTitle, applicantName }) {
  return sendMail({
    to,
    subject: `DriverAll — Yeni Başvuru: ${jobTitle || "İlanınız"}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
        <h2 style="color:#3b82f6">Yeni Başvuru</h2>
        <p>Merhaba <strong>${userName || "Kullanıcı"}</strong>,</p>
        <p><strong>${applicantName || "Bir aday"}</strong>, <strong>${jobTitle || "ilanınıza"}</strong> başvurdu.</p>
        <p>Başvuruyu incelemek için panele giriş yapın.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
        <p style="font-size:12px;color:#94a3b8">DriverAll • Sürücü Platformu</p>
      </div>
    `,
  });
}

/** Hoş geldin emaili */
async function notifyWelcome({ to, userName, role }) {
  const roleLabel = { driver: "Sürücü", employer: "İşveren", advertiser: "Reklam Veren" }[role] || "Kullanıcı";
  return sendMail({
    to,
    subject: "DriverAll'a Hoş Geldiniz!",
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
        <h2 style="color:#10b981">Hoş Geldiniz!</h2>
        <p>Merhaba <strong>${userName || "Kullanıcı"}</strong>,</p>
        <p>DriverAll platformuna <strong>${roleLabel}</strong> olarak kaydınız tamamlandı.</p>
        <p>Profilinizi tamamlayarak hemen kullanmaya başlayabilirsiniz.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
        <p style="font-size:12px;color:#94a3b8">DriverAll • Sürücü Platformu</p>
      </div>
    `,
  });
}

module.exports = {
  sendMail,
  notifyPaymentApproved,
  notifyJobApproved,
  notifyJobRejected,
  notifyNewApplication,
  notifyWelcome,
};
