import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import SESTransport from 'nodemailer/lib/ses-transport';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

export default class NodeMailer {
	getTransporter = async (): Promise<any> => {
		// create reusable transporter object using the default SMTP transport
		// TODO: user own SMTP server
		const transporter = nodemailer.createTransport({
			host: 'smtp.ethereal.email',
			port: 587,
			secure: false,
			auth: {
				user: 'alfred58@ethereal.email',
				pass: 'hXXjau63caQSem1Jef',
			},
		});
		return transporter;
	};

	sendMail = async ({ to, subject, html }: Mail.Options): Promise<boolean> => {
		const transporter = await this.getTransporter();

		const mailOptions: Mail.Options = {
			from: '"Name of the user" <alfred58@ethereal.email>', // sender address
			to, // list of receivers
			subject,
			html,
		};
		transporter.sendMail(
			mailOptions,
			(err: unknown, info: SESTransport.SentMessageInfo | SMTPTransport.SentMessageInfo) => {
				if (err) return false;
				else {
					// currently we can see the link only here not in gmail
					console.log(nodemailer.getTestMessageUrl(info));
					return true;
				}
			}
		);
		return false;
	};
}
