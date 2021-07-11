import express from 'express';
import { cancelGizzz, createGizzz, joinSquad, leaveSquad } from '../gizzz/gizzzHandler';
import * as utils from '../common/utils';
import ResStatus from './ResStatus';
import { getAuthenticatedUser } from '../common/utils';

export const create = async (req: express.Request, res: express.Response): Promise<void> => {
    const user = req.headers.authorization ? getAuthenticatedUser(req.headers.authorization) : undefined;
    const { channel, target } = req.body;
    if (user && channel && target) {
        const gizzzId = await createGizzz(user, channel, target);
        if (gizzzId) {
            res.send(utils.getResponse(ResStatus.Success, gizzzId));
        } else {
            res.sendStatus(422);
        }
    } else {
        res.send(utils.getResponse(ResStatus.Empty));
    }
};

export const join = async (req: express.Request, res: express.Response): Promise<void> => {
    const gizzzId = req.params.id;
    const user = req.headers.authorization ? getAuthenticatedUser(req.headers.authorization) : undefined;
    if (user && gizzzId) {
        if (await joinSquad(user, gizzzId)) {
            res.sendStatus(200);
        } else {
            res.sendStatus(422);
        }
    } else {
        res.sendStatus(400);
    }
};

export const leave = async (req: express.Request, res: express.Response): Promise<void> => {
    const gizzzId = req.params.id;
    const user = req.headers.authorization ? getAuthenticatedUser(req.headers.authorization) : undefined;
    if (user && gizzzId) {
        if (await leaveSquad(user, gizzzId)) {
            res.sendStatus(200);
        } else {
            res.sendStatus(422);
        }
    } else {
        res.sendStatus(400);
    }
};

export const cancel = async (req: express.Request, res: express.Response): Promise<void> => {
    const gizzzId = req.params.id;
    const user = req.headers.authorization ? getAuthenticatedUser(req.headers.authorization) : undefined;
    if (gizzzId && user) {
        if (await cancelGizzz(gizzzId, user)) {
            res.sendStatus(200);
        } else {
            res.sendStatus(422);
        }
    } else {
        res.sendStatus(400);
    }
};
