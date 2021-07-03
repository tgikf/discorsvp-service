import express from 'express';
import * as userController from './controllers/userController';
import * as gizzController from './controllers/gizzzController';

const app = express();
const PORT = 8080;
const API_BASE_PATH = '/api';
app.get('/', (req, res) => {
    res.sendStatus(400);
});

app.get(API_BASE_PATH + '/user/:id/channels', userController.getChannels);
app.get(API_BASE_PATH + '/user/:id/rating', userController.getRating);

app.post(API_BASE_PATH + '/gizz/create', gizzController.create);

app.listen(PORT, () => {
    console.log(`server started at http://localhost:${PORT}`);
});
