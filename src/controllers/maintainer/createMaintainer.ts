import { Request, Response } from 'express';

export class CreateMaitainer {
	pong = (req: Request, res: Response) => {
		res.status(200).send('pong');
	};
}
