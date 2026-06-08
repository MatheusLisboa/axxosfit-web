import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config();

const apiKey = process.env.RESEND_API_KEY?.trim();
const from =
  process.env.RESEND_FROM_EMAIL?.trim() ||
  'AxxosFit <noreply@mail.axxosfit.com.br>';
const to = process.argv[2] || 'matheus.fillipe@hotmail.com';

if (!apiKey) {
  console.error('❌ RESEND_API_KEY não configurada no .env');
  process.exit(1);
}

const resend = new Resend(apiKey);

const { data, error } = await resend.emails.send({
  from,
  to: [to],
  subject: 'Teste AxxosFit — Resend',
  html: `
    <h1>Teste de envio</h1>
    <p>Este é um e-mail de teste da plataforma <strong>AxxosFit</strong>.</p>
    <p>Se você recebeu esta mensagem, a integração com o Resend está funcionando.</p>
  `,
});

if (error) {
  console.error('❌ Falha ao enviar:', error);
  process.exit(1);
}

console.log('✅ E-mail enviado com sucesso!');
console.log('ID:', data?.id);
console.log('Para:', to);
console.log('De:', from);
