import fs from 'fs';
import path from 'path';

import { sendEmail, sendWelcomeEmail, resendVerificationEmail } from './email';

describe('email', () => {
  it('should convert markdown to text and html', async () => {
    const result = await sendEmail(
      { to: 'test@example.com', from: 'test@example.com', subject: 'Test' },
      '**Bold Text** Regular text',
      null,
    );

    const {
      envelope: { to },
    } = result;
    const converted = result.response.toString();

    expect(to).toEqual(['test@example.com']);
    expect(converted).toMatch('Content-Type: multipart/alternative;');
    expect(converted).toMatch('Content-Type: text/plain');
    expect(converted).toMatch('Content-Type: text/html');
    expect(converted).toMatch('**Bold Text** Regular text');
    expect(converted).toMatch('<p><strong>Bold Text</strong> Regular text</p>');
  });

  it('should insert template variables', async () => {
    const result = await sendWelcomeEmail(
      { email: 'test@example.com', name: 'John Doe', url: 'https://example.com/test' },
      null,
    );

    const converted = result.response.toString();

    expect(converted).toMatch('Hello John Doe');
    expect(converted).toMatch('https://example.com/test');
    expect(converted).not.toMatch('<%= url %>');
    expect(converted).toMatch('John Doe <test@example.com>');
  });

  it('should extract template variables', async () => {
    const result = await resendVerificationEmail(
      { email: 'test@example.com', name: 'John Doe', url: 'https://example.com/test' },
      null,
    );

    const template = fs.readFileSync(path.join(__dirname, '../templates/resend.md'), 'utf8');
    const [subject] = template.match(/^subject=.+$/m);
    const converted = result.response.toString();

    expect(subject).toBeTruthy();
    expect(converted).toMatch(`Subject: ${subject.split('=')[1]}`);
  });
});
