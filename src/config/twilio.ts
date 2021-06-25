import { Twilio } from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID as string;
const authToken = process.env.TWILIO_AUTH_TOKEN as string;

const client = new Twilio(accountSid, authToken);

export default client;
