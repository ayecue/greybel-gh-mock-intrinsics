import BasicInterface from './interface';
import { EMail } from './types';
import mockEnvironment from './mock/environment';

export function create(email: EMail): BasicInterface {
	const itrface: Map<string, Function> = new Map();

	itrface.set('fetch', (_: any): string[] => {
		const result: string[] = [];

		email.messages.forEach((item, id) => {
			result.push([
				`${id} - ${item.subject}`,
				item.message
			].join('\n'));
		});

		return result;
	});

    itrface.set('read', (_: any, id: any): string => {
		const mailId = id?.toString();
		const item = email.messages.get(mailId);

		if (!item) {
			return;
		}

		return [
			`${id} - ${item.subject}`,
			item.message
		].join('\n');
	});

    itrface.set('send', (_: any, address: any, subject: string, message: string): string | boolean => {
		const targetEmail = mockEnvironment.getEmail(address?.toString());

		if (!targetEmail) {
			return 'No email found';
		}
		
		targetEmail.messages.set(mockEnvironment.generateUUID(), {
			subject: subject?.toString(),
			message: message?.toString()
		});

		return true;
	});

    itrface.set('delete', (_: any, id: any): string | boolean => {
		const mailId = id?.toString();
		
		if (email.messages.delete(mailId)) {
			return true;
		}

		return 'No email with that id.';
	});

	return new BasicInterface('metaMail', itrface);
}