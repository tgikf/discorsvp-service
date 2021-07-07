import express from 'express';
import { createGizzz, joinSquad, leaveSquad } from '../gizzz/gizzzHandler';

export const create = (req: express.Request, res: express.Response): void => {
    const { user, channel, target } = req.body;
    if (user && channel && target) {
        const gizzzId = createGizzz(user, channel, target);
        res.send({ status: 'success', gizzzId });
    } else {
        res.sendStatus(400);
    }
};

export const join = async (req: express.Request, res: express.Response): Promise<void> => {
    const { user, gizzzId } = req.body;
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
