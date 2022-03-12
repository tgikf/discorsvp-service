import Session from '../session/Session';
import SessionStatus from '../session/types/SessionStatus';
import DiscChannel from '../discord/types/DiscChannel';
import DiscordUser from '../session/types/DiscordUser';
import emitSessionUpdateEvent from '../app';
import sessionCollection from '../model/sessionCollection';

export const updateSessionOnDiscordEvent = async (user: DiscordUser, join: boolean, channel: DiscChannel) => {
    const channelSession = await sessionCollection
        .where('channel', '==', channel)
        .where('status', '==', SessionStatus.Pending)
        .get();

    if (!channelSession.empty) {
        const session = channelSession.docs[0].data();
        if (session.isSquadMember(user)) {
            session.updateSquadMember(user, join);
        } else if (join) {
            session.addOthersMember(user);
        } else {
            session.removeOthersMember(user);
        }
        await sessionCollection.doc(session.id!).set(session);
        emitSessionUpdateEvent(session);
    }
    return channelSession.docs[0].data() || undefined;
};

export const createSession = async (
    owner: DiscordUser,
    channel: DiscChannel,
    target: number,
    others: DiscordUser[],
    audience?: DiscordUser[],
) => {
    const pendingSessionOwner = await sessionCollection
        .where('owner.id', '==', owner.id)
        .where('status', '==', SessionStatus.Pending)
        .get();
    if (pendingSessionOwner.empty) {
        const pendingSessionChannel = await sessionCollection
            .where('channel', '==', channel)
            .where('status', '==', SessionStatus.Pending)
            .get();
        if (pendingSessionChannel.empty) {
            const res = await sessionCollection.add(
                new Session(SessionStatus.Pending, owner, channel, target, [], others, audience),
            );
            return res.id;
        }
        throw Error('Channel already has a pending session.');
    } else {
        throw Error('Owner already has a pending session.');
    }
};

export const joinSquad = async (user: DiscordUser, sessionId: string) => {
    const sessionResult = await sessionCollection.doc(sessionId).get();
    if (sessionResult.exists) {
        const session = sessionResult.data();
        if (session && session.isPending && session.isInAudience(user) && !session.isSquadMember(user)) {
            session.addSquadMember(user);
            await sessionCollection.doc(sessionId).set(session);
            emitSessionUpdateEvent(session);
        } else {
            throw Error('Squad join failure: user not eligible');
        }
    }
    throw Error('Squad join failure: session not found');
};

export const leaveSquad = async (user: DiscordUser, sessionId: string) => {
    const sessionResult = await sessionCollection.doc(sessionId).get();
    if (sessionResult.exists) {
        const session = sessionResult.data();
        if (session && session.isPending && session.isSquadMember(user)) {
            session.removeSquadMember(user);
            await sessionCollection.doc(sessionId).set(session);
            emitSessionUpdateEvent(session);
        } else {
            throw Error('Squad leave failure: user not eligible');
        }
    }
    throw Error('Squad leave failure: session not found');
};

export const cancelSession = async (user: DiscordUser, sessionId: string) => {
    const sessionResult = await sessionCollection.doc(sessionId).get();
    if (sessionResult.exists) {
        const session = sessionResult.data();
        if (session && session.isPending && session.owner.id === user.id) {
            session.status = SessionStatus.Cancelled;
            await sessionCollection.doc(sessionId).set(session);
            emitSessionUpdateEvent(session);
        } else {
            throw Error('Session cancellation failure: session or user invalid');
        }
    }
    throw Error('Session cancellation failure: session not found');
};
