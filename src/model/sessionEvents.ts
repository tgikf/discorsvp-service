import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import Session from '../session/Session';
import SessionStatus from '../session/types/SessionStatus';
import DiscChannel from '../discord/types/DiscChannel';
import DiscordUser from '../session/types/DiscordUser';
import * as serviceAccount from '../../discorsvp.key.json';

initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
});

const converter = {
    toFirestore: (data: Session) => {
        console.log('called', data.serialize());
        return data.serialize();
    },
    fromFirestore: (snap: FirebaseFirestore.QueryDocumentSnapshot) => {
        const { status, owner, channel, target, squad, others, audience } = snap.data();
        return new Session(status, owner, channel, target, squad, others, audience);
    },
};

const sessionCollection = getFirestore().collection('sessions').withConverter(converter);

export const updateSessionModelOnDiscordEvent = async (
    user: DiscordUser,
    join: boolean,
    channel: DiscChannel,
    emitEventCallback: (session: Session) => void,
) => {
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
        await sessionCollection.doc(channelSession.docs[0].id).set(session);
        emitEventCallback(session);
    }
};

export const createSession = async (
    owner: DiscordUser,
    channel: DiscChannel,
    target: number,
    squad: { member: DiscordUser; hasJoined: boolean }[],
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
                new Session(SessionStatus.Pending, owner, channel, target, squad, others, audience),
            );
            return res.id;
        }
        throw Error('Channel already has a pending session.');
    } else {
        throw Error('Owner already has a pending session.');
    }
};

export const joinSquad = async (
    user: DiscordUser,
    sessionId: string,
    emitEventCallback: (session: Session) => void,
) => {
    const sessionResult = await sessionCollection.doc(sessionId).get();
    if (sessionResult.exists) {
        const session = sessionResult.data();
        if (session && session.isPending && session.isInAudience(user) && !session.isSquadMember(user)) {
            session.addSquadMember(user);
            await sessionCollection.doc(sessionId).set(session);
            emitEventCallback(session);
        } else {
            throw Error('Squad join failure: user not eligible');
        }
    }
    throw Error('Squad join failure: session not found');
};

export const leaveSquad = async (
    user: DiscordUser,
    sessionId: string,
    emitEventCallback: (session: Session) => void,
) => {
    const sessionResult = await sessionCollection.doc(sessionId).get();
    if (sessionResult.exists) {
        const session = sessionResult.data();
        if (session && session.isPending && session.isSquadMember(user)) {
            session.removeSquadMember(user);
            await sessionCollection.doc(sessionId).set(session);
            emitEventCallback(session);
        } else {
            throw Error('Squad leave failure: user not eligible');
        }
    }
    throw Error('Squad leave failure: session not found');
};

export const cancelSession = async (
    user: DiscordUser,
    sessionId: string,
    emitEventCallback: (session: Session) => void,
) => {
    const sessionResult = await sessionCollection.doc(sessionId).get();
    if (sessionResult.exists) {
        const session = sessionResult.data();
        if (session && session.isPending && session.owner.id === user.id) {
            session.status = SessionStatus.Cancelled;
            await sessionCollection.doc(sessionId).set(session);
            emitEventCallback(session);
        } else {
            throw Error('Session cancellation failure: session or user invalid');
        }
    }
    throw Error('Session cancellation failure: session not found');
};

export const getPendingSessions = async (user: DiscordUser) => {
    const pendingSessions = await sessionCollection
        .where('status', '==', SessionStatus.Pending)
        .where('audience', 'array-contains-any', [user, { id: 'no', name: 'audience' }])
        .get();

    return pendingSessions.docs.map((e) => ({ id: e.id, session: e.data() }));
};

export const getSessionHistory = async (user: DiscordUser) => {
    const ownerHistory = await sessionCollection
        .where('owner.id', '==', user.id)
        .where('squad', 'array-contains', user)
        .get();

    const squadMemberHistory = await sessionCollection.where('squad', 'array-contains', user).get();

    return [
        ...ownerHistory.docs.map((e) => ({ id: e.id, session: e.data() })),
        ...squadMemberHistory.docs.map((e) => ({ id: e.id, session: e.data() })),
    ];
};
