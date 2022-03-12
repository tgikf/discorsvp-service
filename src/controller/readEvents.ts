import sessionCollection from '../model/sessionCollection';
import DiscordUser from '../session/types/DiscordUser';
import SessionStatus from '../session/types/SessionStatus';

export const getPendingSessions = async (user: DiscordUser) => {
    const pendingSessions = await sessionCollection
        .where('status', '==', SessionStatus.Pending)
        .where('audience', 'array-contains-any', [user, { id: 'no', name: 'audience' }])
        .get();

    return pendingSessions.docs.map((e) => e.data());
};

export const getSessionHistory = async (user: DiscordUser) => {
    const ownerHistory = await sessionCollection
        .where('owner.id', '==', user.id)
        .where('squad', 'array-contains', user)
        .get();

    const squadMemberHistory = await sessionCollection.where('squad', 'array-contains', user).get();

    return [...ownerHistory.docs.map((e) => e.data()), ...squadMemberHistory.docs.map((e) => e.data)];
};
/*
const bot = new DiscordBot();

export const getDiscordDetails = async () => bot.getAllChannelIds(); */
