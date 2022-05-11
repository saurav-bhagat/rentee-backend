import { Router } from 'express';
import { initiatePayment, paymentResponse } from '../payment/paytm.controller';
const router: Router = Router();

router.post('/initiate-payment', initiatePayment);
router.post('/payment-response', paymentResponse);
router.post('/test', (req, res) => {
	console.log('in test');
	res.json({ msg: 'response form backend' });
});

export default router;
