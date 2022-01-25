import { CustomNil } from 'greybel-interpreter';
import BasicInterface from './interface';
import {
    getFile,
    getTraversalPath,
    putFile,
    getPermissions
} from './utils';
import {
    User,
    Computer,
    networks,
    Network,
    getLocal,
    FileType,
    File,
    userList,
    Folder
} from './mock-environment';

export function create(user: User, computer: Computer): BasicInterface {
	const itrface: Map<string, Function> = new Map();

    itrface.set('aireplay', (_: any, bssid: any, essid: any, maxAcks: any): Promise<string | null> => {
        const meta = {
			bssid: bssid?.toString(),
			essid: essid?.toString(),
            maxAcks: Number(maxAcks?.valueOf())
		};
		const network = networks.find((item: Network) => {
            return (
                item.bssid === item.bssid &&
                item.essid === item.essid
            );
        });

        if (!network) {
            return Promise.reject('No network found');
        }

        return new Promise((resolve) => {
            setTimeout(() => {
                const folder = getFile(computer.fileSystem, getLocal().home) as Folder;
                putFile(folder, {
                    name: 'file.cap',
                    content: network.password,
                    owner: user.username,
                    permissions: 'drwxr--r--',
                    type: FileType.Ack
                });
                resolve(null);
            }, meta.maxAcks * 10);
        });
	});

    itrface.set('airmon', (_: any): string => {
        return 'start';
	});

    itrface.set('aircrack', (_: any, path: any): string | null => {
        const meta = {
			path: path?.toString()
		};
        const traversalPath = getTraversalPath(meta.path);
        const file = getFile(computer.fileSystem, traversalPath) as File;

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
        const user = userList.find((item: User) => {
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