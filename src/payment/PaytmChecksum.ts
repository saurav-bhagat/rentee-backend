import crypto, { BinaryLike } from 'crypto';

class PaytmChecksum {
	static iv: BinaryLike | null;
	static encrypt(input: any, key: any) {
		const cipher = crypto.createCipheriv('AES-128-CBC', key, PaytmChecksum.iv);
		let encrypted = cipher.update(input, 'binary', 'base64');
		encrypted += cipher.final('base64');
		return encrypted;
	}
	static decrypt(encrypted: any, key: any) {
		const decipher = crypto.createDecipheriv('AES-128-CBC', key, PaytmChecksum.iv);
		let decrypted = decipher.update(encrypted, 'base64', 'binary');
		try {
			decrypted += decipher.final('binary');
		} catch (e) {
			console.log(e);
		}
		return decrypted;
	}
	static generateSignature(params: any, key: any) {
		if (typeof params !== 'object' && typeof params !== 'string') {
			const error = 'string or object expected, ' + typeof params + ' given.';
			return Promise.reject(error);
		}
		if (typeof params !== 'string') {
			params = PaytmChecksum.getStringByParams(params);
		}
		return PaytmChecksum.generateSignatureByString(params, key);
	}

	static verifySignature(params: any, key: any, checksum: any) {
		if (typeof params !== 'object' && typeof params !== 'string') {
			const error = 'string or object expected, ' + typeof params + ' given.';
			return Promise.reject(error);
		}
		// eslint-disable-next-line no-prototype-builtins
		if (params.hasOwnProperty('CHECKSUMHASH')) {
			delete params.CHECKSUMHASH;
		}
		if (typeof params !== 'string') {
			params = PaytmChecksum.getStringByParams(params);
		}
		return PaytmChecksum.verifySignatureByString(params, key, checksum);
	}

	static async generateSignatureByString(params: any, key: any) {
		const salt: string = await PaytmChecksum.generateRandomString(4);
		return PaytmChecksum.calculateChecksum(params, key, salt);
	}

	static verifySignatureByString(params: string, key: any, checksum: any) {
		const paytm_hash = PaytmChecksum.decrypt(checksum, key);
		const salt = paytm_hash.substr(paytm_hash.length - 4);
		return paytm_hash === PaytmChecksum.calculateHash(params, salt);
	}

	static generateRandomString(length: number): Promise<string> {
		return new Promise(function (resolve, reject) {
			crypto.randomBytes((length * 3.0) / 4.0, function (err, buf) {
				if (!err) {
					const salt: string = buf.toString('base64');
					resolve(salt);
				} else {
					console.log('error occurred in generateRandomString: ' + err);
					reject(err);
				}
			});
		});
	}

	static getStringByParams(params: any) {
		const data: { [key: string]: any } = {};
		Object.keys(params)
			.sort()
			.forEach((key, value) => {
				data[key] = params[key] !== null && params[key].toLowerCase() !== 'null' ? params[key] : '';
			});
		return Object.values(data).join('|');
	}

	static calculateHash(params: string, salt: string) {
		const finalString = params + '|' + salt;
		return crypto.createHash('sha256').update(finalString).digest('hex') + salt;
	}
	static calculateChecksum(params: any, key: any, salt: string) {
		const hashString = PaytmChecksum.calculateHash(params, salt);
		return PaytmChecksum.encrypt(hashString, key);
	}
}
PaytmChecksum.iv = '@@@@&&&&####$$$$';
export default PaytmChecksum;
