import BasicInterface from './interface';
import {
    getFile,
    getTraversalPath,
    putFile,
    getPermissions,
    getHomePath
} from './utils';
import {
	User,
	Computer,
	Network,
	FileType,
	Folder,
	File
} from './types';
import mockEnvironment from './mock/environment';

export function create(user: User, computer: Computer): BasicInterface {
	const itrface: Map<string, Function> = new Map();

    itrface.set('aireplay', (_: any, bssid: any, essid: any, maxAcks: any): string | null => {
        const meta = {
			bssid: bssid?.toString(),
			essid: essid?.toString(),
            maxAcks: Number(maxAcks?.valueOf())
		};
		const network = mockEnvironment.networks.find((item: Network) => {
            return (
                item.bssid === item.bssid &&
                item.essid === item.essid
            );
        });

        if (!network) {
            return 'No network found';
        }

        const folder = getFile(computer.fileSystem, getHomePath(user, computer)) as Folder;

        putFile(folder, {
            name: 'file.cap',
            content: network.password,
            owner: user.username,
            permissions: 'drwxr--r--',
            type: FileType.Ack
        });

        return null;
	});

    itrface.set('airmon', (_: any): string => {
        return 'start';
	});

    itrface.set('aircrack', (_: any, path: any): string | null => {
        const meta = {
			path: path?.toString()
		};
        const traversalPath = getTraversalPath(meta.path, getHomePath(user, computer));
        const file = getFile(computer.fileSystem, traversalPath) as File;

        if (!file) {
            return null;
        }

        const { r } = getPermissions(user, file);

		if (!r) {
			return null;
		}

        if (file.type !== FileType.Ack) {
            return null;
        }

        return file.content;
    });

    itrface.set('decipher', (_: any, encryptedPass: string): string | null => {
        const meta = {
			encryptedPass: encryptedPass?.toString()
		};
        const user = mockEnvironment.users.find((item: User) => {
            return item.passwordHashed === meta.encryptedPass;
        });

        if (!user) {
            return null;
        }

        return user.password;
    });

    itrface.set('smtp_user_list', (_: any): string[] => {
        return [];
    });

	return new BasicInterface('crypto', itrface);
}