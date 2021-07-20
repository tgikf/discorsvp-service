import express from 'express';
import { cancelGizzz, createGizzz, joinSquad, leaveSquad } from '../gizzz/gizzzHandler';
import * as utils from '../common/utils';
import ResStatus from './ResStatus';
import { getAuthenticatedUser } from '../common/utils';

export const create = async (req: express.Request, res: express.Response): Promise<void> => {
    const userId = req.headers.authorization ? getAuthenticatedUser(req.headers.authorization) : undefined;
    const { channel, target } = req.body;
    if (userId && channel && target) {
        const gizzzId = await createGizzz(
            { id: userId, name: utils.getUserDisplayName(userId) || 'not found' },
            channel,
            target,
        );
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
    const userId = req.headers.authorization ? getAuthenticatedUser(req.headers.authorization) : undefined;
    if (userId && gizzzId) {
        if (await joinSquad({ id: userId, name: utils.getUserDisplayName(userId) || 'not found' }, gizzzId)) {
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
    const userId = req.headers.authorization ? getAuthenticatedUser(req.headers.authorization) : undefined;
    if (userId && gizzzId) {
        if (await leaveSquad({ id: userId, name: utils.getUserDisplayName(userId) || 'not found' }, gizzzId)) {
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
    const userId = req.headers.authorization ? getAuthenticatedUser(req.headers.authorization) : undefined;
    if (gizzzId && userId) {
        if (await cancelGizzz(gizzzId, { id: userId, name: utils.getUserDisplayName(userId) || 'not found' })) {
            res.sendStatus(200);
        } else {
            res.sendStatus(422);
        }
    } else {
        res.sendStatus(400);
    }
};
