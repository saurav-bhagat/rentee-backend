import { Router } from 'express';
import { callBackUrl, getPaymentToken } from '../paytm/paytm.controller';
const router: Router = Router();

router.post('/paynow', getPaymentToken);
router.post('/callBack', callBackUrl);
router.post('/test', (req, res) => {
	console.log('in test');
	res.json({ msg: 'response form backend' });
});

export default router;
