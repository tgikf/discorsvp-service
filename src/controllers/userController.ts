import express from 'express';
import * as utils from './utils';

export const getChannels = (req: express.Request, res: express.Response): void => {
    res.send(utils.getChannels());
};

export const getRating = (req: express.Request, res: express.Response): void => {
    res.send('NOT IMPLEMENTED: user/getRating');
};
