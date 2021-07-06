import express from 'express';
import * as dotenv from 'dotenv';
import * as userController from './controllers/userController';
import * as gizzzController from './controllers/gizzzController';
import DiscBot from './discord/DiscBot';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;
const API_BASE_PATH = '/api';

app.use(express.json());

app.get('/', (req, res) => {
    res.sendStatus(400);
});

app.get(API_BASE_PATH + '/user/:id/channels', userController.getChannels);
app.get(API_BASE_PATH + '/user/:id/rating', userController.getRating);

app.post(API_BASE_PATH + '/gizzz/create', gizzzController.create);
app.post(API_BASE_PATH + '/gizzz/join', gizzzController.join);
app.post(API_BASE_PATH + '/gizzz/leave', gizzzController.leave);

app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});

export const bot = new DiscBot();
