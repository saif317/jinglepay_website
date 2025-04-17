export const prerender = false;

import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resendApiKey = import.meta.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.error('Resend API key is not set in environment variables.');
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

const recipientEmail = 'seif@jinglepay.com';
const senderEmail = 'onboarding@resend.dev';

export const POST: APIRoute = async ({ request }) => {
  if (!resend) {
    console.error('Resend client could not be initialized. API key missing?');
    return new Response(JSON.stringify({ message: 'Server configuration error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const formData = await request.formData();
  const firstName = formData.get('firstName')?.toString().trim();
  const lastName = formData.get('lastName')?.toString().trim();
  const email = formData.get('email')?.toString().trim();
  const phone = formData.get('phone')?.toString().trim() || 'Not provided';
  const reason = formData.get('reason')?.toString().trim();
  const message = formData.get('message')?.toString().trim();

  if (!firstName || !lastName || !email || !reason || !message) {
    return new Response(JSON.stringify({ message: 'Missing required fields.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const subject = `New Contact Form Submission - ${reason}`;
  const htmlBody = `
    <h1>New Contact Form Submission</h1>
    <p>You received a new message from your website contact form:</p>
    <ul>
      <li><strong>First Name:</strong> ${firstName}</li>
      <li><strong>Last Name:</strong> ${lastName}</li>
      <li><strong>Email:</strong> ${email}</li>
      <li><strong>Phone:</strong> ${phone}</li>
      <li><strong>Reason:</strong> ${reason}</li>
    </ul>
    <h2>Message:</h2>
    <p>${message.replace(/\n/g, '<br>')}</p>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: `Contact Form <${senderEmail}>`,
      to: [recipientEmail],
      replyTo: email,
      subject: subject,
      html: htmlBody,
    });

    if (error) {
      console.error('Resend API Error:', error);
      return new Response(JSON.stringify({ message: 'Failed to send message.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Resend Success:', data);
    return new Response(JSON.stringify({ message: 'Message received successfully!' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({ message: 'Failed to send message due to a server error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
