import { Request, Response } from 'express';

export class MaintainerUtils {
	pong = (req: Request, res: Response) => {
		res.status(200).send('pong');
	};
}
