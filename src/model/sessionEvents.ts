import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import Session from '../session/Session';
import SessionStatus from '../session/types/SessionStatus';
import DiscChannel from '../discord/types/DiscChannel';
import DiscordUser from '../session/types/DiscordUser';

initializeApp({
    credential: applicationDefault(),
});

const converter = {
    toFirestore: (data: Session) => data.serialize(),
    fromFirestore: (snap: FirebaseFirestore.QueryDocumentSnapshot) => {
        const { status, owner, channel, target, squad, others, audience, created } = snap.data();
        return new Session(status, owner, channel, target, squad, others, audience, created.toDate());
    },
};

const sessionCollection = getFirestore().collection('sessions').withConverter(converter);

export const updateSessionModelOnDiscordEvent = async (
    user: DiscordUser,
    join: boolean,
    channel: DiscChannel,
    emitEventCallback: (sessionId: string, stringsession: Session) => void,
) => {
    const channelSession = await sessionCollection
        .where('channel.serverChannelId', '==', channel.serverChannelId)
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
        await sessionCollection.doc(channelSession.docs[0].id).set(session);
        emitEventCallback(channelSession.docs[0].id, session);
    }
};

export const createSession = async (
    owner: DiscordUser,
    channel: DiscChannel,
    target: number,
    squad: { member: DiscordUser; hasConnected: boolean }[],
    others: DiscordUser[],
    emitEventCallback: (sessionId: string, stringsession: Session) => void,
    audience?: DiscordUser[],
) => {
    const pendingSessionOwner = await sessionCollection
        .where('squad', 'array-contains-any', [
            { member: owner, hasConnected: false },
            { member: owner, hasConnected: true },
        ])
        .where('status', '==', SessionStatus.Pending)
        .get();
    if (pendingSessionOwner.empty) {
        const pendingSessionChannel = await sessionCollection
            .where('channel.serverChannelId', '==', channel.serverChannelId)
            .where('status', '==', SessionStatus.Pending)
            .get();
        if (pendingSessionChannel.empty) {
            const session = new Session(SessionStatus.Pending, owner, channel, target, squad, others, audience);
            const res = await sessionCollection.add(session);
            emitEventCallback(res.id, session);
            return res.id;
        }
        throw Error('Channel already has a pending session.');
    } else {
        throw Error('You have already joined another ongoing session.');
    }
};

export const joinSquad = async (
    user: DiscordUser,
    sessionId: string,
    emitEventCallback: (sessionId: string, stringsession: Session) => void,
) => {
    const sessionResult = await sessionCollection.doc(sessionId).get();
    if (sessionResult.exists) {
        const pendingSessionUser = await sessionCollection
            .where('squad', 'array-contains', [user])
            .where('status', '==', SessionStatus.Pending)
            .get();

        const session = sessionResult.data();
        if (
            pendingSessionUser.empty &&
            session &&
            session.isPending &&
            session.isInAudience(user) &&
            !session.isSquadMember(user)
        ) {
            session.addSquadMember(user);
            await sessionCollection.doc(sessionId).set(session);
            emitEventCallback(sessionId, session);
            return true;
        }
        throw Error('Squad join failure: user not eligible');
    }
    throw Error('Squad join failure: session not found');
};

export const leaveSquad = async (
    user: DiscordUser,
    sessionId: string,
    emitEventCallback: (sessionId: string, stringsession: Session) => void,
) => {
    const sessionResult = await sessionCollection.doc(sessionId).get();
    if (sessionResult.exists) {
        const session = sessionResult.data();
        if (session && session.isPending && session.isSquadMember(user)) {
            session.removeSquadMember(user);
            await sessionCollection.doc(sessionId).set(session);
            emitEventCallback(sessionId, session);
            return true;
        }
        throw Error('Squad leave failure: user not eligible');
    }
    throw Error('Squad leave failure: session not found');
};

export const cancelSession = async (
    user: DiscordUser,
    sessionId: string,
    emitEventCallback: (sessionId: string, stringsession: Session) => void,
) => {
    const sessionResult = await sessionCollection.doc(sessionId).get();
    if (sessionResult.exists) {
        const session = sessionResult.data();
        if (session && session.isPending && session.owner.id === user.id) {
            session.status = SessionStatus.Cancelled;
            await sessionCollection.doc(sessionId).set(session);
            emitEventCallback(sessionId, session);
            return true;
        }
        throw Error('Session cancellation failure: session or user invalid');
    }
    throw Error('Session cancellation failure: session not found');
};

export const getPendingSessions = async (user: DiscordUser) => {
    const pendingSessions = await sessionCollection
        .where('status', '==', SessionStatus.Pending)
        .where('audience', 'array-contains-any', [user, { id: 'no', name: 'audience' }])
        .orderBy('created', 'desc')
        .get();

    const sorted = pendingSessions.docs
        .map((e) => ({ id: e.id, ...e.data().serialize() }))
        .sort((a, b) => {
            if (a.owner.id === user.id || a.squad.find((e) => e.member.id === user.id)) return -1;
            if (b.owner.id === user.id || b.squad.find((e) => e.member.id === user.id)) return 1;
            return 0;
        });
    return sorted;
};

export const getSessionHistory = async (user: DiscordUser) => {
    const userHistory = await sessionCollection
        .where('squad', 'array-contains-any', [
            { member: user, hasConnected: false },
            { member: user, hasConnected: true },
        ])
        .orderBy('created', 'desc')
        .orderBy('status')
        .get();

    return userHistory.docs.map((e) => ({ id: e.id, ...e.data().serialize() }));
};
