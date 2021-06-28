const https = require('https');
/*
 * import checksum generation utility
 * You can get this utility from https://developer.paytm.com/docs/checksum/
 */
const PaytmChecksumLib = require('./PaytmChecksum');

export const getPaymentToken = (req, res) => {
	console.log('in  getPaytm get token ');
	const { name, email, amount } = req.body;

	var paytmParams = {};

	const orderId = 'TEST_' + new Date().getTime();
	const customerId = 'Ram_' + new Date().getTime();

	paytmParams.body = {
		requestType: 'Payment',
		mid: process.env.MERCHANT_ID,
		websiteName: process.env.WEBSITE_NAME,
		orderId: orderId,
		callbackUrl: 'https://localhost:3000/payment/callback',
		txnAmount: {
			value: '1.00',
			currency: 'INR',
		},
		userInfo: {
			custId: customerId,
		},
	};

	/*
	 * Generate checksum by parameters we have in body
	 * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys
	 */
	PaytmChecksumLib.generateSignature(JSON.stringify(paytmParams.body), process.env.MERCHANT_KEY).then(function (
		checksum
	) {
		paytmParams.head = {
			signature: checksum,
		};

		var post_data = JSON.stringify(paytmParams);

		var options = {
			/* for Staging */
			hostname: 'securegw-stage.paytm.in' /* for Production */, // hostname: 'securegw.paytm.in',

			port: 443,
			path: `/theia/api/v1/initiateTransaction?mid=${process.env.MERCHANT_ID}&orderId=${orderId}`,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': post_data.length,
			},
		};

		var response = '';
		var post_req = https.request(options, function (post_res) {
			post_res.on('data', function (chunk) {
				response += chunk;
			});

			post_res.on('end', function () {
				response = JSON.parse(response);
				console.log('Response: ', response.body.txnToken);

				res.json({ response, orderId, customerId, callBackUrl: 'https://localhost:3000/p/callback' });
			});
		});

		post_req.write(post_data);
		post_req.end();
	});
};

export const callBackUrl = (req, res) => {
	console.log('in callBack response');
};
