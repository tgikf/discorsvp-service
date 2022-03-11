import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import Session from './session/Session';
import validateTokenSignature from './common/auth';

const sockets = new Map<string, Socket>();

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: '*',
    },
    allowEIO3: true,
});

io.engine.on('connection_error', (err: { req: any; code: any; message: any; context: any }) => {
    // console.log(err.req); // the request object
    // console.log(err.code); // the error code, for example 1
    console.log(err.message); // the error message, for example "Session ID unknown"
    console.log(err.context); // some additional error context
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
    // @ts-ignore
    console.log(`Socket opened ${socket.data.user}`);

    if (!sockets.get(socket.data.user)) {
        sockets.set(socket.data.user, socket);
    }

    socket.on('request', (data) => {
        console.log('request received with', data, socket.handshake);
    });

    socket.on('connect_error', (err) => {
        console.log(`connect_error due to ${err.message}`);
    });
});

httpServer.listen(3000);

const emitSessionUpdateEvent = (session: Session) => {
    Array.from(sockets.keys()).forEach((client) => {
        if (session.squad.find((member) => member.member.id === client) && session.isComplete()) {
            sockets.get(client)?.volatile.emit('SessionUpdate', session, true);
        } else {
            sockets.get(client)?.volatile.emit('SessionUpdate', session, false);
        }
    });
};

export default emitSessionUpdateEvent;
