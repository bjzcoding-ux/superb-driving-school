const Stripe = require('stripe');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { student_name, phone, package_name, amount_cents } = req.body;

  if (!student_name || !amount_cents || !package_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  const SITE_URL = process.env.SITE_URL || 'https://www.superbdrivingschool.com.au';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'aud',
          product_data: {
            name: `Superb Driving School — ${package_name.slice(0, 100)}`,
            description: `Booked for: ${student_name.slice(0, 200)}`
          },
          unit_amount: amount_cents
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${SITE_URL}/pay?status=success`,
      cancel_url:  `${SITE_URL}/pay`,
      metadata: {
        student_name: student_name.slice(0, 500),
        phone:        (phone || '').slice(0, 50),
        package_name: package_name.slice(0, 200)
      }
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
