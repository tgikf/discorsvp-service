import express from 'express';
import type { ErrorRequestHandler } from 'express';

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
let origin = 'INVALID_ORIGIN';

const authConfig = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET,
    baseURL: process.env.SERVICE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE,
};

const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
    return res.sendStatus(400);
};

app.use(jwtCheck);

app.use((req, res, next) => {
    origin = req.headers.origin ? req.headers.origin : 'INVALID_ORIGIN';
    if (process.env.ALLOWED_ORIGINS?.includes(origin)) {
        cors({
            origin: origin,
        });
    }
});

app.use(auth(authConfig));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get(API_BASE_PATH + '/user/home', appController.getHome);
app.get(API_BASE_PATH + '/user/channels', userController.getChannels);
app.get(API_BASE_PATH + '/user/rating', userController.getRating);

app.post(API_BASE_PATH + '/gizzz/create', gizzzController.create);
app.post(API_BASE_PATH + '/gizzz/:id/join', gizzzController.join);
app.post(API_BASE_PATH + '/gizzz/:id/leave', gizzzController.leave);
app.post(API_BASE_PATH + '/gizzz/:id/cancel', gizzzController.cancel);

app.use(errorHandler);

//app can't be used hereafter anymore
const httpServer = createServer(app);
export const io = new Server(httpServer, {
    cors: {
        origin: origin,
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
    console.log(`API Server started at ${process.env.SERVICE_URL}`);
});
