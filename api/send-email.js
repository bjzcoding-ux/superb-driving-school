const { Resend } = require('resend');

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, phone, email, stage, pkg, suburb } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Missing name or phone' });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from:    'Superb Driving School <noreply@superbdrivingschool.com.au>',
      to:      ['amrit80@bigpond.com'],
      subject: `New Student Registration — ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px">
          <div style="background:#E8650A;padding:18px 24px;border-radius:10px 10px 0 0">
            <h2 style="color:#fff;margin:0;font-size:18px">New Student Registration</h2>
            <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:14px">Superb Driving School</p>
          </div>
          <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;padding:20px 24px">
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:8px 0;color:#777;width:120px;vertical-align:top">Name</td><td style="padding:8px 0;font-weight:700;color:#111">${escHtml(name)}</td></tr>
              <tr><td style="padding:8px 0;color:#777;border-top:1px solid #f3f4f6">Phone</td><td style="padding:8px 0;font-weight:700;color:#E8650A;border-top:1px solid #f3f4f6"><a href="tel:${escHtml(phone)}" style="color:#E8650A">${escHtml(phone)}</a></td></tr>
              <tr><td style="padding:8px 0;color:#777;border-top:1px solid #f3f4f6">Email</td><td style="padding:8px 0;font-weight:600;color:#333;border-top:1px solid #f3f4f6">${escHtml(email) || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#777;border-top:1px solid #f3f4f6">Suburb</td><td style="padding:8px 0;font-weight:600;color:#333;border-top:1px solid #f3f4f6">${escHtml(suburb) || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#777;border-top:1px solid #f3f4f6">Stage</td><td style="padding:8px 0;font-weight:600;color:#333;border-top:1px solid #f3f4f6">${escHtml(stage) || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#777;border-top:1px solid #f3f4f6">Package</td><td style="padding:8px 0;font-weight:600;color:#333;border-top:1px solid #f3f4f6">${escHtml(pkg) || '—'}</td></tr>
            </table>
            <div style="margin-top:20px;padding:14px 16px;background:#FFF7F0;border-radius:8px;border:1px solid rgba(232,101,10,0.2)">
              <p style="margin:0;font-size:13px;color:#777">Log in to the instructor portal to view all students and add this booking to the schedule.</p>
            </div>
          </div>
        </div>
      `
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Resend error:', err.message);
    // Non-critical — don't fail the registration
    res.status(200).json({ ok: false, warning: err.message });
  }
};
