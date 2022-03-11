import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as serviceAccount from '../../discorsvp.key.json';
import Session from './Session';
import SessionStatus from './types/SessionStatus';
import DiscChannel from '../discord/types/DiscChannel';
import DiscordUser from './types/DiscordUser';
import emitSessionUpdateEvent from '../app';

initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
});

const converter = {
    toFirestore: (data: Session) => data.serialize(),
    fromFirestore: (snap: FirebaseFirestore.QueryDocumentSnapshot) => {
        const { status, owner, channel, target, squad, others, id, audience } = snap.data();
        return new Session(status, owner, channel, target, squad, others, id, audience);
    },
};

const collection = getFirestore().collection('sessions').withConverter(converter);

export const updateOnDiscordEvent = async (join: boolean, channel: DiscChannel, user: { id: string; name: string }) => {
    const channelSession = await collection
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
        await collection.doc(session.id!).set(session);
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
    const pendingSessionOwner = await collection
        .where('owner', '==', owner)
        .where('status', '==', SessionStatus.Pending)
        .get();
    if (pendingSessionOwner.empty) {
        const pendingSessionChannel = await collection
            .where('channel', '==', channel)
            .where('status', '==', SessionStatus.Pending)
            .get();
        if (pendingSessionChannel.empty) {
            const res = await collection.add(
                new Session(SessionStatus.Pending, owner, channel, target, [], others, undefined, audience),
            );
            return res.id;
        }
        throw Error('Channel already has a pending session.');
    } else {
        throw Error('Owner already has a pending session.');
    }
};

export const joinSquad = async (user: DiscordUser, sessionId: string) => {
    const sessionResult = await collection.doc(sessionId).get();
    if (sessionResult.exists) {
        const session = sessionResult.data();
        if (session && session.isPending && session.isInAudience(user) && !session.isSquadMember(user)) {
            session.addSquadMember(user);
            await collection.doc(sessionId).set(session);
            emitSessionUpdateEvent(session);
        } else {
            throw Error('Squad join failure: user not eligible');
        }
    }
    throw Error('Squad join failure: session not found');
};

export const leaveSquad = async (user: DiscordUser, sessionId: string) => {
    const sessionResult = await collection.doc(sessionId).get();
    if (sessionResult.exists) {
        const session = sessionResult.data();
        if (session && session.isPending && session.isSquadMember(user)) {
            session.removeSquadMember(user);
            await collection.doc(sessionId).set(session);
            emitSessionUpdateEvent(session);
        } else {
            throw Error('Squad leave failure: user not eligible');
        }
    }
    throw Error('Squad leave failure: session not found');
};

export const cancelSession = async (sessionId: string, user: DiscordUser) => {
    const sessionResult = await collection.doc(sessionId).get();
    if (sessionResult.exists) {
        const session = sessionResult.data();
        if (session && session.isPending && session.owner === user) {
            session.status = SessionStatus.Cancelled;
            await collection.doc(sessionId).set(session);
            emitSessionUpdateEvent(session);
        } else {
            throw Error('Session cancellation failure: session or user invalid');
        }
    }
    throw Error('Session cancellation failure: session not found');
};
