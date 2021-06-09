import { Request, Response } from 'express';

export const pong = (req: Request, res: Response) => {
	res.status(200).send('pong');
};
