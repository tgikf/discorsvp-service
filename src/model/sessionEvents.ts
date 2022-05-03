import DiscChannel from '../discord/types/DiscChannel';
import Session from '../session/Session';
import DiscordUser from '../session/types/DiscordUser';
import SessionStatus from '../session/types/SessionStatus';
import { EmitSessionUpdateEvent, SessionEventType } from '../types/EmitSessionUpdateEvent';
import { sessionCollection } from '../firebase/connection';

export const updateSessionModelOnDiscordEvent = async (
    user: DiscordUser,
    join: boolean,
    channel: DiscChannel,
    emitEventCallback: EmitSessionUpdateEvent,
) => {
    const channelSession = await sessionCollection
        .where('channel.serverChannelId', '==', channel.serverChannelId)
        .where('status', '==', SessionStatus.Pending)
        .get();
    if (!channelSession.empty) {
        const session = channelSession.docs[0].data();
        let event = SessionEventType.None;
        if (session.isSquadMember(user)) {
            session.updateSquadMember(user, join);
            if (join && session.isComplete()) {
                event = SessionEventType.Complete;
            } else if (join) {
                event = SessionEventType.Join;
            } else {
                event = SessionEventType.Disconnect;
            }
        } else if (join) {
            session.addOthersMember(user);
        } else {
            session.removeOthersMember(user);
        }
        await sessionCollection.doc(channelSession.docs[0].id).set(session);
        emitEventCallback(user, channelSession.docs[0].id, session, event);
    }
};

export const createSession = async (
    owner: DiscordUser,
    channel: DiscChannel,
    target: number,
    squad: { member: DiscordUser; hasConnected: boolean }[],
    others: DiscordUser[],
    emitEventCallback: EmitSessionUpdateEvent,
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
            emitEventCallback(owner, res.id, session, SessionEventType.Create);
            return res.id;
        }
        throw Error('Channel already has a pending session.');
    } else {
        throw Error('You have already joined another ongoing session.');
    }
};

export const joinSquad = async (user: DiscordUser, sessionId: string, emitEventCallback: EmitSessionUpdateEvent) => {
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
            !session.isSquadMember(user) &&
            session.squad.length < session.target
        ) {
            session.addSquadMember(user);
            await sessionCollection.doc(sessionId).set(session);
            emitEventCallback(user, sessionId, session, SessionEventType.Join);
            return true;
        }
        throw Error('Squad join failure: user not eligible');
    }
    throw Error('Squad join failure: session not found');
};

export const leaveSquad = async (user: DiscordUser, sessionId: string, emitEventCallback: EmitSessionUpdateEvent) => {
    const sessionResult = await sessionCollection.doc(sessionId).get();
    if (sessionResult.exists) {
        const session = sessionResult.data();
        if (session && session.isPending && session.isSquadMember(user)) {
            session.removeSquadMember(user);
            await sessionCollection.doc(sessionId).set(session);
            emitEventCallback(user, sessionId, session, SessionEventType.Leave);
            return true;
        }
        throw Error('Squad leave failure: user not eligible');
    }
    throw Error('Squad leave failure: session not found');
};

export const cancelSession = async (
    user: DiscordUser,
    sessionId: string,
    emitEventCallback: EmitSessionUpdateEvent,
) => {
    const sessionResult = await sessionCollection.doc(sessionId).get();
    if (sessionResult.exists) {
        const session = sessionResult.data();
        if (session && session.isPending && session.owner.id === user.id) {
            session.status = SessionStatus.Cancelled;
            await sessionCollection.doc(sessionId).set(session);
            emitEventCallback(user, sessionId, session, SessionEventType.Cancel);
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
