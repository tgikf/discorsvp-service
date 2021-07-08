import express from 'express';
import { createGizzz, joinSquad, leaveSquad } from '../gizzz/gizzzHandler';
import * as utils from './utils';

export const create = (req: express.Request, res: express.Response): void => {
    const { channel, target } = req.body;
    const { user } = utils.getUserAndId(req);
    if (user && channel && target) {
        const gizzzId = createGizzz(user, channel, target);
        res.send(utils.getResponse(ResStatus.Success, gizzzId));
    } else {
        res.send(utils.getResponse(ResStatus.Empty));
    }
};

export const join = async (req: express.Request, res: express.Response): Promise<void> => {
    const { user, gizzzId } = utils.getUserAndId(req);
    if (user && gizzzId) {
        if (await joinSquad(user, gizzzId)) {
            res.sendStatus(200);
        } else {
            res.sendStatus(400);
        }
    } else {
        res.sendStatus(400);
    }
};

export const leave = async (req: express.Request, res: express.Response): Promise<void> => {
    const { user, gizzzId } = req.body;
    if (user && gizzzId) {
        if (await leaveSquad(user, gizzzId)) {
            res.sendStatus(200);
        } else {
            res.sendStatus(400);
        }
    } else {
        res.sendStatus(400);
    }
};
