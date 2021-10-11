import { logger } from '@appsemble/node-utils';
import { defaultLocale, has } from '@appsemble/utils';
import { FormatXMLElementFn, IntlMessageFormat, PrimitiveType } from 'intl-messageformat';
import tags from 'language-tags';
import { createTransport, SendMailOptions as MailerSendMailOptions, Transporter } from 'nodemailer';
import { Options } from 'nodemailer/lib/smtp-transport';
import { Op } from 'sequelize';

import { AppMessages } from '../../models';
import { argv } from '../argv';
import { getAppsembleMessages, getSupportedLanguages } from '../getAppsembleMessages';
import { readAsset } from '../readAsset';
import { renderEmail } from './renderEmail';

const supportedLanguages = getSupportedLanguages();
export interface Recipient {
  /**
   * The email address of the recipient.
   */
  email: string;

  /**
   * The name of the recipient.
   */
  name?: string;
}

export interface SendMailOptions {
  /**
   * The email address of the recipient
   */
  to?: string;

  /**
   * The email address(es) to BCC the mail to.
   */
  cc?: string[] | string;

  /**
   * The email address(es) to BCC the mail to.
   */
  bcc?: string[] | string;

  /**
   * The subject of the email.
   */
  subject: string;

  /**
   * The HTML content of the email.
   */
  html: string;

  /**
   * The plain-text content of the email.
   */
  text: string;

  /**
   * The attachments to include in the email.
   */
  attachments?: MailerSendMailOptions['attachments'];
}

/**
 * A class to simplify sending emails.
 */
export class Mailer {
  transport: Transporter;

  constructor() {
    const { smtpFrom, smtpHost, smtpPass, smtpPort, smtpSecure, smtpUser } = argv;
    if (smtpHost) {
      const auth = (smtpUser && smtpPass && { user: smtpUser, pass: smtpPass }) || null;
      this.transport = createTransport(
        {
          port: smtpPort || smtpSecure ? 465 : 587,
          pool: true,
          host: smtpHost,
          secure: smtpSecure,
          auth,
        } as Options,
        { from: smtpFrom },
      );
    }
  }

  /**
   * Check if the SMTP connection still works
   *
   * @throws If the SMTP connection no longer works.
   */
  async verify(): Promise<void> {
    if (!this.transport) {
      logger.warn('SMTP hasn’t been configured.');
      return;
    }
    await this.transport.verify();
  }

  async sendTranslatedEmail({
    appId,
    emailName,
    locale = defaultLocale,
    to,
    values,
  }: {
    to: Recipient;
    appId: number;
    emailName: string;
    values: Record<string, FormatXMLElementFn<string, string[] | string> | PrimitiveType>;
    locale: string;
  }): Promise<void> {
    const lang = locale.toLowerCase();
    const baseLanguage = tags(lang)
      .subtags()
      .find((sub) => sub.type() === 'language');
    const baseLang = baseLanguage && String(baseLanguage).toLowerCase();
    const appMessages = await AppMessages.findAll({
      where: {
        AppId: appId,
        language: { [Op.or]: baseLang ? [baseLang, lang, defaultLocale] : [lang, defaultLocale] },
      },
    });

    const subjectKey = `server.emails.${emailName}.subject`;
    const bodyKey = `server.emails.${emailName}.body`;

    let templateSubject: string;
    let templateBody: string;

    const langMessages = appMessages.find((a) => a.language === lang);
    const baseLangMessages = appMessages.find((a) => a.language === baseLang);
    const defaultLocaleMessages = appMessages.find((a) => a.language === defaultLocale);

    if (
      langMessages &&
      has(langMessages.messages?.server, subjectKey) &&
      has(langMessages.messages?.server, bodyKey)
    ) {
      templateSubject = langMessages.messages.server[subjectKey];
      templateBody = langMessages.messages.server[bodyKey];
    } else if (
      baseLangMessages &&
      has(baseLangMessages.messages?.server, subjectKey) &&
      has(baseLangMessages.messages?.server, bodyKey)
    ) {
      templateSubject = baseLangMessages.messages.server[subjectKey];
      templateBody = baseLangMessages.messages.server[bodyKey];
    } else if (
      defaultLocaleMessages &&
      has(defaultLocaleMessages.messages?.server, subjectKey) &&
      has(defaultLocaleMessages.messages?.server, bodyKey)
    ) {
      templateSubject = defaultLocaleMessages.messages.server[subjectKey];
      templateBody = defaultLocaleMessages.messages.server[bodyKey];
    } else if ((await supportedLanguages).has(baseLang) || (await supportedLanguages).has(lang)) {
      const coreMessages = await getAppsembleMessages(lang, baseLang);
      if (has(coreMessages, bodyKey) && has(coreMessages, subjectKey)) {
        templateSubject = coreMessages[subjectKey];
        templateBody = coreMessages[bodyKey];
      }
    }

    if (!templateSubject || !templateBody) {
      const messages = await getAppsembleMessages(defaultLocale);
      templateSubject = messages[subjectKey];
      templateBody = messages[bodyKey];
    }

    const sub = new IntlMessageFormat(templateSubject, locale).format(values);
    const body = new IntlMessageFormat(templateBody, locale).format(values);

    const { html, subject, text } = await renderEmail(body as string, {}, sub as string);

    await this.sendEmail({
      to: to.name ? `${to.name} <${to.email}>` : to.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send an email using the configured SMTP transport.
   *
   * @param to - The email
   * @param templateName - The name of the Markdown email template to send
   * @param values - A key/value pair of values to use for rendering the email.
   */
  async sendTemplateEmail(
    to: Recipient,
    templateName: string,
    values: Record<string, string>,
  ): Promise<void> {
    const template = await readAsset(`email/${templateName}.md`, 'utf-8');
    const { html, subject, text } = await renderEmail(template, {
      ...values,
      greeting: to.name ? `Hello ${to.name}` : 'Hello',
    });

    await this.sendEmail({
      to: to.name ? `${to.name} <${to.email}>` : to.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send an email using the configured SMTP transport.
   *
   * @param options - The options specifying the contents and metadata of the email
   */
  async sendEmail({
    to,
    cc,
    bcc,
    subject,
    html,
    text,
    attachments = [],
  }: SendMailOptions): Promise<void> {
    if (!this.transport) {
      logger.warn('SMTP hasn’t been configured. Not sending real email.');
    }
    logger.info(
      `Sending email:\nTo: ${to} | CC: ${cc} | BCC: ${bcc}\nSubject: ${subject}\n\n${text}`,
    );

    if (attachments.length) {
      logger.info(
        `Including ${attachments.length} attachments: ${JSON.stringify(
          attachments.map((a) => a.path || a.filename),
        )}`,
      );
    }
    if (this.transport) {
      await this.transport.sendMail({ html, subject, text, to, attachments });
    }
    logger.verbose('Email sent succesfully.');
  }
}
