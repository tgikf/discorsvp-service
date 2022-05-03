import DiscordUser from '../session/types/DiscordUser';
import { deviceCollection, rootFirestore } from '../firebase/connection';

export const persistDeviceToken = async (user: DiscordUser, token: string) => {
    await deviceCollection.doc(user.id).set({ token });
};

export const getDeviceTokens = async (include: DiscordUser[], exclude?: DiscordUser[]) => {
    const excludeIds = exclude?.map((e) => e.id);
    const includeIds = include
        .filter((e) => !excludeIds?.includes(e.id))
        .map((e) => rootFirestore.doc(`devices/${e.id}`));

    // fetch requested tokens
    if (includeIds.length > 0) {
        const snapshot = await rootFirestore.getAll(...includeIds);
        return snapshot.map((doc) => doc.data()?.token);
    }
    // fetch all tokens and exclude unwanted ones
    return (await deviceCollection.get()).docs
        .filter((doc) => !excludeIds?.includes(doc.id))
        .map((doc) => doc.data()?.token);
};
