import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import validateTokenSignature from './common/auth';
import DiscordBot from './discord/DiscordBot';
import {
    cancelSession,
    createSession,
    getPendingSessions,
    getSessionHistory,
    joinSquad,
    leaveSquad,
    updateSessionModelOnDiscordEvent,
} from './model/sessionEvents';
import DiscChannel from './discord/types/DiscChannel';
import SessionAction from './session/types/SessionAction';
import { persistDeviceToken } from './model/deviceEvents';
import { EmitSessionUpdateEvent } from './types/EmitSessionUpdateEvent';
import broadcastEventPush from './common/notification';

const sockets = new Map<string, Socket>();
const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: '*',
    },
    allowEIO3: true,
});

const emitSessionUpdateEvent: EmitSessionUpdateEvent = (user, sessionId, session, eventType) => {
    Array.from(sockets.keys()).forEach((client) => {
        sockets.get(client)?.emit('SessionUpdate', JSON.stringify({ id: sessionId, ...session.serialize() }));
    });
    broadcastEventPush(user, sessionId, session.serialize(), eventType);
};

const bot = new DiscordBot(updateSessionModelOnDiscordEvent, emitSessionUpdateEvent);

io.engine.on('connection_error', (err: any) => {
    console.log(err);
});

io.use(async (socket, next) => {
    const authToken = socket.handshake.headers.authorization;
    if (authToken) {
        try {
            const decoded = await validateTokenSignature(authToken);
            if (decoded) {
                const discUserId = decoded.sub.split('|')[2];
                // eslint-disable-next-line no-param-reassign
                socket.data.user = discUserId;

                const deviceToken = socket.handshake.headers.device as string;
                if (deviceToken) {
                    try {
                        await persistDeviceToken({ id: discUserId }, deviceToken);
                    } catch (err: any) {
                        next(err);
                    }
                } else {
                    next(Error('Device token missing'));
                }
                next();
            }
        } catch (err: any) {
            next(err);
        }
    } else {
        next(Error('Auth token missing'));
    }
});

io.on('connection', async (socket: Socket) => {
    console.log(`Socket opened ${socket.data.user}`);
    sockets.set(socket.data.user, socket);
    const userName = await bot.getUserDisplayName(socket.data.user);
    const currentUser = { id: socket.data.user, name: userName };
    socket.on(
        'CreateSession',
        async (data: { channel: DiscChannel; target: number }, acknowledge: (data: any) => void) => {
            const allChannelMembers = await bot.getUserIdsByChannel(data.channel);
            const ownerIndex = allChannelMembers.findIndex((e) => e.id === currentUser.id);
            const others = ownerIndex >= 0 ? allChannelMembers.splice(ownerIndex, 1) : allChannelMembers;
            try {
                const id = await createSession(
                    currentUser,
                    data.channel,
                    data.target,
                    [{ member: currentUser, hasConnected: ownerIndex >= 0 }],
                    others,
                    emitSessionUpdateEvent,
                );
                acknowledge(JSON.stringify({ success: true, message: `session created ${id}` }));
            } catch (e) {
                acknowledge(JSON.stringify({ success: false, message: `${e}` }));
            }
        },
    );

    socket.on('connect_error', (err) => {
        console.log(`connect_error due to ${err.message}`);
    });
    socket.on('GetChannels', async (acknowledge: (response: any) => void) => {
        acknowledge(await bot.getAllChannelIds());
    });

    socket.on('GetPendingSessions', async (acknowledge: (response: any) => void) =>
        acknowledge(JSON.stringify(await getPendingSessions(currentUser))),
    );

    socket.on('GetUserHistory', async (acknowledge: (response: any) => void) =>
        acknowledge(JSON.stringify(await getSessionHistory(currentUser))),
    );

    socket.on(
        'SessionAction',
        async (data: { sessionId: string; action: SessionAction }, acknowledge: (response: any) => void) => {
            const { sessionId, action } = data;
            switch (action) {
                case SessionAction.Join:
                    try {
                        const status = await joinSquad(currentUser, sessionId, emitSessionUpdateEvent);
                        if (status) {
                            acknowledge(JSON.stringify({ success: true, message: `Joined squad.` }));
                        } else {
                            acknowledge(JSON.stringify({ success: false, message: `An error occured.` }));
                        }
                    } catch (e) {
                        acknowledge(JSON.stringify({ success: false, message: `${e}` }));
                    }
                    break;
                case SessionAction.Leave:
                    try {
                        const status = await leaveSquad(currentUser, sessionId, emitSessionUpdateEvent);
                        if (status) {
                            acknowledge(JSON.stringify({ success: true, message: `Left squad.` }));
                        } else {
                            acknowledge(JSON.stringify({ success: false, message: `An error occured.` }));
                        }
                    } catch (e) {
                        acknowledge(JSON.stringify({ success: false, message: `${e}` }));
                    }
                    break;
                case SessionAction.Cancel:
                    try {
                        const status = await cancelSession(currentUser, sessionId, emitSessionUpdateEvent);
                        if (status) {
                            acknowledge(JSON.stringify({ success: true, message: `Cancelled session.` }));
                        } else {
                            acknowledge(JSON.stringify({ success: false, message: `An error occured.` }));
                        }
                    } catch (e) {
                        acknowledge(JSON.stringify({ success: false, message: `${e}` }));
                    }
                    break;
                default:
                    throw Error(`InvalidSession Action:${action}`);
            }

            acknowledge('action acknowledged');
        },
    );
});

httpServer.listen(3000);
console.log('Listening on port 3000', httpServer.address());
