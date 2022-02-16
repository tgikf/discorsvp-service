import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import Session from './session/Session';

const sockets = new Map<string, Socket>();

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: '*',
    },
});

io.on('connection', (socket: Socket) => {
    socket.on('connection', (discUser: string) => {
        console.log(`Socket opened for ${discUser}`);
        sockets.set(discUser, socket);
    });

    socket.on('request', (data) => {
        console.log('request received with', data, socket.handshake);
    });
    socket.on('connect_error', (err) => {
        console.log(`connect_error due to ${err.message}`);
    });
});

httpServer.listen(8080);

const emitWebSocketUpdateEvent = (session: Session) => {
    Array.from(sockets.keys()).forEach((client) => {
        if (session.squad.find((member) => member.member.id === client) && session.isComplete()) {
            sockets.get(client)?.volatile.emit('SessionUpdate', session, true);
        } else {
            sockets.get(client)?.volatile.emit('SessionUpdate', session, false);
        }
    });
};

export default emitWebSocketUpdateEvent;
