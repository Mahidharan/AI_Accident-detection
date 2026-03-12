require('dotenv').config();
const axios = require('axios');

async function test() {
  const params = {
    service_id:  process.env.EMAILJS_SERVICE_ID,
    template_id: process.env.EMAILJS_TEMPLATE_ID,
    user_id:     process.env.EMAILJS_PUBLIC_KEY,
    template_params: {
      to_email:        'mahidharan5612@gmail.com',
      owner_name:      'Mahidharan',
      vehicle_number:  'TN33AB1234',
      airbag_deployed: 'Yes',
      map_link:        'https://www.google.com/maps?q=13.0827,80.2707',
    },
  };

  console.log('Testing REST API with SERVICE_ID:', params.service_id);
  try {
    const res = await axios.post('https://api.emailjs.com/api/v1.0/email/send', params, {
      headers: { 
        'Content-Type': 'application/json',
        'origin': 'http://localhost:3000',
      },
    });
    console.log('SUCCESS! Status:', res.status, '-', res.data);
  } catch (err) {
    console.error('FAILED! Status:', err.response?.status);
    console.error('Response:', err.response?.data);
  }
}

test();
