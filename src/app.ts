import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import Session from './session/Session';
import validateTokenSignature from './common/auth';
import DiscordBot from './discord/DiscordBot';
import {
    createSession,
    getPendingSessions,
    getSessionHistory,
    updateSessionModelOnDiscordEvent,
} from './model/sessionEvents';
import DiscChannel from './discord/types/DiscChannel';

const sockets = new Map<string, Socket>();
const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: '*',
    },
    allowEIO3: true,
});

const emitFullLoadEvent = async (socket: Socket) => {
    const profileData = { sessionHistory: await getSessionHistory({ id: socket.data.user }) };
    const homeData = { pendingSessions: await getPendingSessions({ id: socket.data.user }) };
    socket.emit('FullLoad', homeData, profileData);
};

const emitSessionUpdateEvent = (session: Session) => {
    Array.from(sockets.keys()).forEach((client) => {
        if (session.squad.find((member) => member.member.id === client) && session.isComplete()) {
            sockets.get(client)?.emit('SessionUpdate', session, true);
        } else {
            sockets.get(client)?.emit('SessionUpdate', session, false);
        }
    });
};

const bot = new DiscordBot(updateSessionModelOnDiscordEvent, emitSessionUpdateEvent);

io.engine.on('connection_error', (err: any) => {
    console.log(err);
});

io.use(async (socket, next) => {
    const token = socket.handshake.headers.authorization;
    if (token) {
        try {
            const decoded = await validateTokenSignature(token);
            if (decoded) {
                const discUserId = decoded.sub.split('|')[2];
                // eslint-disable-next-line no-param-reassign
                socket.data.user = discUserId;
                next();
            }
        } catch (err: any) {
            next(err);
        }
    } else {
        next(Error('Token missing'));
    }
});

io.on('connection', (socket: Socket) => {
    console.log(`Socket opened ${socket.data.user}`);
    sockets.set(socket.data.user, socket);

    emitFullLoadEvent(socket);
    socket.on(
        'CreateSession',
        async (data: { channel: DiscChannel; target: number }, acknowledge: (data: any) => void) => {
            const userName = await bot.getUserDisplayName(socket.data.user);
            const owner = { id: socket.data.user, name: userName };
            const allChannelMembers = await bot.getUserIdsByChannel(data.channel);
            const ownerIndex = allChannelMembers.findIndex((e) => e.id === owner.id);
            const others = ownerIndex >= 0 ? allChannelMembers.splice(ownerIndex, 1) : allChannelMembers;

            try {
                const id = await createSession(
                    owner,
                    data.channel,
                    data.target,
                    [{ member: owner, hasJoined: ownerIndex >= 0 }],
                    others,
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
    socket.on('GetChannels', async (acknowledge: (data: any) => void) => {
        acknowledge(await bot.getAllChannelIds());
    });
});

httpServer.listen(3000);

export default emitSessionUpdateEvent;
