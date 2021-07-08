import express from 'express';
import * as utils from './utils';

export const getChannels = (req: express.Request, res: express.Response): void => {
    const channels = utils.getChannels();
    res.send(utils.getResponse(channels ? ResStatus.Success : ResStatus.Empty, channels));
};

export const getRating = (req: express.Request, res: express.Response): void => {
    res.send(utils.getResponse(ResStatus.Empty));
};
