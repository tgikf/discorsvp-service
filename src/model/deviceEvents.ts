import DiscordUser from '../session/types/DiscordUser';
import { deviceCollection } from './connection';

export const persistDeviceToken = async (user: DiscordUser, token: string) => {
    await deviceCollection.doc(user.id).set({ token });
};

export const getDeviceToken = async (user: DiscordUser) => (await deviceCollection.doc(user.id).get()).data();
