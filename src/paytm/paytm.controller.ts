import https from 'https';
import { Request, Response } from 'express';
import PaytmChecksum from './PaytmChecksum';

export const payWithPaytm = (req: Request, res: Response) => {
	console.log(req.body);
	const { amount, name } = req.body;
	const data = { name, amount };
	const orderId = 'TEST_' + new Date().getTime();

	const paytmParams: any = {};

	paytmParams.body = {
		requestType: 'Payment',
		mid: process.env.MERCHANT_ID,
		websiteName: process.env.WEBSITE_NAME,
		orderId: orderId,
		callbackUrl: 'https://403b652d20f4.ngrok.io/payment/callback',
		txnAmount: {
			value: data.amount,
			currency: 'INR',
		},
		userInfo: {
			custId: data.name,
		},
	};

	PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), process.env.MERCHANT_KEY).then(function (
		checksum
	) {
		paytmParams.head = {
			signature: checksum,
		};

		const post_data = JSON.stringify(paytmParams);

		const options = {
			/* for Staging */
			hostname: 'securegw-stage.paytm.in',

			/* for Production */
			// hostname: 'securegw.paytm.in',

			port: 443,
			path: `/theia/api/v1/initiateTransaction?mid=${process.env.MERCHANT_ID}&orderId=${orderId}`,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': post_data.length,
			},
		};

		let response: string;

		const post_req = https.request(options, function (post_res) {
			console.log('i should call first before ');
			post_res.on('data', function (chunk) {
				response += chunk;
			});

			post_res.on('end', function () {
				const parseResponse = JSON.parse(response);

				console.log('txnToken:', parseResponse);

				const txn = parseResponse.body.txnToken;

				const result = {
					url: `https://securegw-stage.paytm.in/theia/api/v1/showPaymentPage?mid=${process.env.MERCHANT_ID}&orderId=${orderId}`,
					mid: `${process.env.MERCHANT_ID}`,
					orderId,
					txn,
				};
				res.render('Request', { result });
			});
		});
		post_req.write(post_data);
		post_req.on('error', (err) => {
			console.log('post req in gen call err', err);
		});
		post_req.end();
	});
};

export const paytmCallBackUrl = (req: any, res: any) => {
	console.log('in call back');
	const data = req.body;
	console.log(data);

	const paytmChecksum = data.CHECKSUMHASH;

	const isVerifySignature = PaytmChecksum.verifySignature(data, process.env.MERCHANT_KEY, paytmChecksum);
	if (isVerifySignature) {
		console.log('Checksum Matched');

		const paytmParams: any = {};

		paytmParams.body = {
			mid: process.env.MERCHANT_ID,
			orderId: data.ORDERID,
		};

		PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), process.env.MERCHANT_KEY).then(function (
			checksum
		) {
			paytmParams.head = {
				signature: checksum,
			};

			const post_data = JSON.stringify(paytmParams);

			const options = {
				/* for Staging */
				hostname: 'securegw-stage.paytm.in',

				/* for Production */
				// hostname: 'securegw.paytm.in',

				port: 443,
				path: '/v3/order/status',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': post_data.length,
				},
			};

			// Set up the request
			let response = '';
			const post_req = https.request(options, function (post_res) {
				post_res.on('data', function (chunk) {
					response += chunk;
				});

				post_res.on('end', function () {
					console.log('Response in : ', response);
					res.render('Response', { code: data.RESPCODE });
					res.end();
				});
			});
			post_req.write(post_data);
			post_req.on('error', (err) => {
				console.log('post req in err in callback ', err);
			});
			post_req.end();
		});
	} else {
		res.status(400).json('Checksum Mismatched');
	}
};
