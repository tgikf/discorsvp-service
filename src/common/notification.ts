import sendPush from '../firebase/messaging';
import { getDeviceTokens } from '../model/deviceEvents';
import DiscordUser from '../session/types/DiscordUser';
import SerializedSession from '../session/types/SerializedSession';
import { SessionEventType } from '../types/EmitSessionUpdateEvent';

const broadcastEventPush = async (
    user: DiscordUser,
    sessionId: string,
    session: SerializedSession,
    eventType: SessionEventType,
) => {
    switch (eventType) {
        case SessionEventType.Create: {
            const message = `${user.name} is gathering a squad in ${session.channel.channel.name} on ${session.channel.server.name}. RSVP now!`;
            const audience = await getDeviceTokens();
            sendPush(message, audience);
            return;
        }
        case SessionEventType.Complete: {
            const message = `Your squad in ${session.channel.channel.name} on ${session.channel.server.name} is ready to go!`;
            const audience = await getDeviceTokens(
                session.squad.map((e) => ({ name: e.member.name, id: e.member.id })),
            );
            sendPush(message, audience);
            return;
        }
        case SessionEventType.Join: {
            const message = `${user.name} has joined your squad in ${session.channel.channel.name} on ${session.channel.server.name}!`;
            const audience = await getDeviceTokens(
                session.squad
                    .filter((e) => e.member.id !== user.id)
                    .map((e) => ({ name: e.member.name, id: e.member.id })),
            );
            sendPush(message, audience);
            return;
        }
        case SessionEventType.Leave: {
            const message = `${user.name} has left your squad in ${session.channel.channel.name} on ${session.channel.server.name}!`;
            const audience = await getDeviceTokens(
                session.squad
                    .filter((e) => e.member.id !== user.id)
                    .map((e) => ({ name: e.member.name, id: e.member.id })),
            );
            sendPush(message, audience);
            return;
        }
        case SessionEventType.Connect: {
            const message = `Your squadmember ${user.name} has connected to ${session.channel.channel.name} on ${session.channel.server.name}.`;
            const audience = await getDeviceTokens(
                session.squad
                    .filter((e) => e.member.id !== user.id)
                    .map((e) => ({ name: e.member.name, id: e.member.id })),
            );
            sendPush(message, audience);
            return;
        }
        case SessionEventType.Disconnect: {
            const message = `Your squadmember ${user.name} has disconnected from ${session.channel.channel.name} on ${session.channel.server.name}.`;
            const audience = await getDeviceTokens(
                session.squad
                    .filter((e) => e.member.id !== user.id)
                    .map((e) => ({ name: e.member.name, id: e.member.id })),
            );
            sendPush(message, audience);
            return;
        }
        case SessionEventType.Cancel: {
            const message = `${user.name} has cancelled the session in ${session.channel.channel.name} on ${session.channel.server.name}.`;
            const audience = await getDeviceTokens(
                session.squad
                    .filter((e) => e.member.id !== user.id)
                    .map((e) => ({ name: e.member.name, id: e.member.id })),
            );
            sendPush(message, audience);
            return;
        }
        default:
            console.log(`event ${eventType} not implemented (triggered on ${sessionId})`);
    }
};

export default broadcastEventPush;
