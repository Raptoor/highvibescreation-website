'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json({ limit: '64kb' }));
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.length === 0) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    if (ALLOWED_ORIGINS.length > 0 && !origin) return res.sendStatus(403);
    if (ALLOWED_ORIGINS.length > 0 && origin && !ALLOWED_ORIGINS.includes(origin)) return res.sendStatus(403);
    return res.sendStatus(204);
  }
  next();
}

app.use(corsMiddleware);

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
const contactMax = parseInt(process.env.RATE_LIMIT_CONTACT_MAX || '1', 10);
const newsletterMax = parseInt(process.env.RATE_LIMIT_NEWSLETTER_MAX || '1', 10);

const contactLimiter = rateLimit({
  windowMs,
  max: contactMax,
  message: { error: 'Too many requests', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
});

const newsletterLimiter = rateLimit({
  windowMs,
  max: newsletterMax,
  message: { error: 'Too many requests', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || '127.0.0.1',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
});

const MAIL_FROM = process.env.MAIL_FROM || 'website@highvibescreation.com';
const MAIL_TO = process.env.MAIL_TO || 'office@highvibescreation.com';

function strip(s, max) {
  if (typeof s !== 'string') return '';
  return s.trim().slice(0, max);
}

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function checkOrigin(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.length === 0) return true;
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    res.status(403).json({ error: 'Origin not allowed' });
    return false;
  }
  return true;
}

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    if (!checkOrigin(req, res)) return;
    const { firstName, lastName, email, phone, service, message, company } = req.body || {};
    if (company != null && String(company).trim() !== '') return res.status(400).json({ error: 'Rejected' });

    const fn = strip(firstName, 120);
    const ln = strip(lastName, 120);
    const em = strip(email, 254);
    const ph = strip(phone, 40);
    const sv = strip(service, 200);
    const msg = strip(message, 12000);

    if (!fn || !ln) return res.status(400).json({ error: 'Name required' });
    if (!em || !isEmail(em)) return res.status(400).json({ error: 'Valid email required' });
    if (!msg) return res.status(400).json({ error: 'Message required' });

    await transporter.sendMail({
      from: `"High Vibes Website" <${MAIL_FROM}>`,
      to: MAIL_TO,
      replyTo: em,
      subject: 'Contact form – highvibescreation.com',
      text: [
        `Name: ${fn} ${ln}`,
        `Email: ${em}`,
        `Phone: ${ph || '—'}`,
        `Service: ${sv || '—'}`,
        '',
        msg,
      ].join('\n'),
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Send failed' });
  }
});

app.post('/api/newsletter', newsletterLimiter, async (req, res) => {
  try {
    if (!checkOrigin(req, res)) return;
    const { email, company } = req.body || {};
    if (company != null && String(company).trim() !== '') return res.status(400).json({ error: 'Rejected' });

    const em = strip(email, 254);
    if (!em || !isEmail(em)) return res.status(400).json({ error: 'Valid email required' });

    await transporter.sendMail({
      from: `"High Vibes Website" <${MAIL_FROM}>`,
      to: MAIL_TO,
      replyTo: em,
      subject: 'Newsletter – highvibescreation.com',
      text: `Newsletter signup from: ${em}`,
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Send failed' });
  }
});

app.listen(PORT, () => {
  console.log(`mail-api listening on ${PORT}`);
});
