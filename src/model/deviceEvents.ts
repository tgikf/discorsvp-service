import DiscordUser from '../session/types/DiscordUser';
import { deviceCollection, rootFirestore } from '../firebase/connection';

export const persistDeviceToken = async (user: DiscordUser, token: string) => {
    await deviceCollection.doc(user.id).set({ token });
};

export const getDeviceToken = async (user: DiscordUser) => (await deviceCollection.doc(user.id).get()).data();

export const getDeviceTokens = async (users?: DiscordUser[]) => {
    if (users && users.length > 0) {
        console.log('users:', users);
        const snapshot = await rootFirestore.getAll(...users.map((u) => rootFirestore.doc(`devices/${u.id}`)));
        return snapshot.map((doc) => {
            console.log(doc.data());
            return doc.data()?.token;
        });
    }
    return (await deviceCollection.get()).docs.map((doc) => doc.data()?.token);
};
