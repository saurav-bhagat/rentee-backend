import https from 'https';
/*
 * import checksum generation utility
 * You can get this utility from https://developer.paytm.com/docs/checksum/
 */
import PaytmChecksum from './PaytmChecksum';

export const getPaymentToken = (req: any, res: any) => {
	console.log('in  getPaytm get token ');
	// const { name, email, amount } = req.body;

	const paytmParams = {} as any;

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
	PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), process.env.MERCHANT_KEY).then(function (
		checksum
	) {
		paytmParams.head = {
			signature: checksum,
		};

		const post_data = JSON.stringify(paytmParams);

		const options = {
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

		let response = '';
		const post_req = https.request(options, function (post_res) {
			post_res.on('data', function (chunk) {
				response += chunk;
			});

			post_res.on('end', function () {
				const responseObj = JSON.parse(response);
				console.log('Response: ', responseObj.body.txnToken);

				res.status(200).json({
					response: responseObj,
					orderId,
					customerId,
					callBackUrl: 'https://localhost:3000/p/callback',
				});
			});
		});

		post_req.write(post_data);
		post_req.end();
	});
};

export const callBackUrl = (req: any, res: any) => {
	console.log('in callBack response');
};
