import express from 'express';
import * as dotenv from 'dotenv';
import * as userController from './controllers/userController';
import * as gizzzController from './controllers/gizzzController';
import * as appController from './controllers/appController';
import DiscBot from './discord/DiscBot';
import cors from 'cors';
import { auth } from 'express-openid-connect';
import cookieParser from 'cookie-parser';

dotenv.config();

const authConfig = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET,
    baseURL: 'http://localhost:' + process.env.PORT,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE,
};

const app = express();
const PORT = process.env.PORT || 8080;
const API_BASE_PATH = '/api';

app.use(cors());
app.use(auth(authConfig));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get(API_BASE_PATH + '/user/current', appController.getHome);
app.get(API_BASE_PATH + '/user/channels', userController.getChannels);
app.get(API_BASE_PATH + '/user/rating', userController.getRating);

app.post(API_BASE_PATH + '/gizzz/create', gizzzController.create);
app.post(API_BASE_PATH + '/gizzz/:id/join', gizzzController.join);
app.post(API_BASE_PATH + '/gizzz/:id/leave', gizzzController.leave);

app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});

export const bot = new DiscBot();
