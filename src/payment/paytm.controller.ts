import https from 'https';
import { Request, Response } from 'express';
import PaytmChecksum from './PaytmChecksum';
import { v4 as uuid4 } from 'uuid';
import Payment from '../models/payment/payment';
import Tenant from '../models/tenant/tenant';

export const initiatePayment = (req: Request, res: Response) => {
	const { amount, name } = req.body;
	const data = { name, amount };
	let { orderId } = req.body;
	// orderId is tenant userId + uuid
	orderId += uuid4().substr(0, 3);
	const customerId = uuid4();

	const paytmParams: any = {};
	paytmParams.body = {
		requestType: 'Payment',
		mid: process.env.MERCHANT_ID,
		websiteName: process.env.WEBSITE_NAME,
		orderId: orderId,
		callbackUrl: `${process.env.HOST_NAME}/payment/payment-response`,
		txnAmount: {
			value: data.amount,
			currency: 'INR',
		},
		userInfo: {
			custId: customerId,
		},
	};
	const options = {
		hostname: process.env.PAYTM_HOST_NAME,
		port: 443,
		path: `/theia/api/v1/initiateTransaction?mid=${process.env.MERCHANT_ID}&orderId=${orderId}`,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
	};
	paytmGenerateSignatueUtil(req, res, paytmParams, options, true, {}, orderId);
};

export const paymentResponse = async (req: any, res: any) => {
	const data = req.body;
	const paytmChecksum = data.CHECKSUMHASH;

	const isVerifySignature = PaytmChecksum.verifySignature(data, process.env.MERCHANT_KEY, paytmChecksum);
	if (isVerifySignature) {
		const paytmParams: any = {};

		paytmParams.body = {
			mid: process.env.MERCHANT_ID,
			orderId: data.ORDERID,
		};
		const options = {
			hostname: process.env.PAYTM_HOST_NAME,
			port: 443,
			path: '/v3/order/status',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
		};
		paytmGenerateSignatueUtil(req, res, paytmParams, options, false, data, {});
		const {
			CURRENCY: currency,
			GATEWAYNAME: gatewayName,
			RESPMSG: respMsg,
			BANKNAME: bankName,
			PAYMENTMODE: paymentMode,
			RESPCODE: respCode,
			TXNID: txnId,
			TXNAMOUNT: txnAmount,
			ORDERID: orderId,
			STATUS: status,
			BANKTXNID: bankTxnId,
			TXNDATE: txnDate,
		} = data;

		const paymentDocument = await Payment.create({
			currency,
			gatewayName,
			respMsg,
			bankName,
			respCode,
			orderId,
			bankTxnId,
			txnAmount,
			txnId,
			status,
			txnDate,
			paymentMode,
		});

		if (paymentDocument) {
			const tenantUserId = orderId.substr(0, 24);
			const tenantDocument = await Tenant.findOneAndUpdate(
				{ userId: tenantUserId },
				{ $push: { payments: paymentDocument._id } }
			);
			if (!tenantDocument) {
				console.log('unable to push payment id in tenant ');
			}
		} else {
			console.log('unable to create payment document');
		}
	} else {
		res.status(400).json('Checksum Mismatched');
	}
};

export const paytmGenerateSignatueUtil = (
	req: Request,
	res: Response,
	paytmParams: any,
	options: any,
	flag: boolean,
	data: any,
	orderId: any
) => {
	PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), process.env.MERCHANT_KEY).then(function (
		checksum
	) {
		paytmParams.head = {
			signature: checksum,
		};

		const post_data = JSON.stringify(paytmParams);
		options.headers['Content-Length'] = post_data.length;
		// Set up the request
		let response = '';
		const post_req = https.request(options, function (post_res) {
			post_res.on('data', function (chunk) {
				response += chunk;
			});
			if (flag) {
				post_res.on('end', function () {
					const parseResponse = JSON.parse(response);
					const txn = parseResponse.body.txnToken;
					const result = {
						url: `${process.env.PAYTM_SHOW_PAYMENT_PAGE}&orderId=${orderId}`,
						mid: `${process.env.MERCHANT_ID}`,
						orderId,
						txn,
					};
					res.render('InitiateTransaction', { result });
				});
			} else {
				post_res.on('end', function () {
					data = JSON.stringify(data);
					res.render('PaymentResponse', { data });
					res.end();
				});
			}
		});
		post_req.write(post_data);
		post_req.on('error', (err) => {
			console.log('post req in err in callback ', err);
			let data = `{
				"RESPMSG":"Server error"
			}`;
			data = JSON.stringify(data);
			res.render('PaymentResponse', { data });
		});
		post_req.end();
	});
};
