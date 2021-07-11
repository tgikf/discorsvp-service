import express from 'express';
import * as dotenv from 'dotenv';
import * as userController from './controllers/userController';
import * as gizzzController from './controllers/gizzzController';
import * as appController from './controllers/appController';
import cors from 'cors';
import { auth } from 'express-openid-connect';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import * as utils from './common/utils';
import { jwtCheck } from './common/auth';

dotenv.config();
const PORT = process.env.PORT || 8080;
const app = express();
const API_BASE_PATH = '/api';

const authConfig = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET,
    baseURL: 'http://localhost:' + PORT,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE,
};

app.use(jwtCheck);
app.use(
    cors({
        origin: process.env.SPA_URL,
    }),
);
app.use(auth(authConfig));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get(API_BASE_PATH + '/online', (req, res) => {
    res.sendStatus(200);
});

app.get(API_BASE_PATH + '/user/home', appController.getHome);
app.get(API_BASE_PATH + '/user/channels', userController.getChannels);
app.get(API_BASE_PATH + '/user/rating', userController.getRating);

app.post(API_BASE_PATH + '/gizzz/create', gizzzController.create);
app.post(API_BASE_PATH + '/gizzz/:id/join', gizzzController.join);
app.post(API_BASE_PATH + '/gizzz/:id/leave', gizzzController.leave);

//app can't be used after hereafter anymore
const httpServer = createServer(app);
export const io = new Server(httpServer, {
    cors: {
        origin: process.env.SPA_URL,
        methods: ['GET', 'POST'],
    },
});
io.on('connection', (socket: Socket) => {
    socket.on('clientInfo', (discUser: string) => {
        console.log('clientInfo event', discUser);
        utils.addClient(discUser, socket);
    });
});

httpServer.listen(PORT, () => {
    console.log(`API Server started at http://localhost:${PORT}`);
});
