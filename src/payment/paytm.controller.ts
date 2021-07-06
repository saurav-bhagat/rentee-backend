import https from 'https';
import { Request, Response } from 'express';
import PaytmChecksum from './PaytmChecksum';
import { v4 as uuid4 } from 'uuid';

export const initiatePayment = (req: Request, res: Response) => {
	const { amount, name } = req.body;
	const data = { name, amount };

	const orderId = uuid4();
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
		/* for Staging */
		hostname: process.env.PAYTM_HOST_NAME,
		/* for Production */
		// hostname: 'process.env.PAYTM_HOST_NAME',
		port: 443,
		path: `/theia/api/v1/initiateTransaction?mid=${process.env.MERCHANT_ID}&orderId=${orderId}`,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
	};
	paytmGenerateSignatueUtil(req, res, paytmParams, options, true, {}, orderId);
};

export const paymentResponse = (req: any, res: any) => {
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
			/* for Staging */
			hostname: process.env.PAYTM_HOST_NAME,

			/* for Production */
			// hostname: 'process.env.PAYTM_HOST_NAME',

			port: 443,
			path: '/v3/order/status',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
		};
		paytmGenerateSignatueUtil(req, res, paytmParams, options, false, data, {});
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
					res.render('PaymentResponse', { code: data.RESPCODE });
					res.end();
				});
			}
		});
		post_req.write(post_data);
		post_req.on('error', (err) => {
			console.log('post req in err in callback ', err);
		});
		post_req.end();
	});
};
