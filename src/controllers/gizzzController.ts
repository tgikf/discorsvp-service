import express from 'express';
import { cancelGizzz, createGizzz, joinSquad, leaveSquad } from '../gizzz/gizzzHandler';
import * as utils from '../common/utils';
import ResStatus from './ResStatus';
import { getAuthenticatedUser } from '../common/utils';

export const create = async (req: express.Request, res: express.Response): Promise<void> => {
    const userId = req.headers.authorization ? getAuthenticatedUser(req.headers.authorization) : undefined;
    const { channel, target } = req.body;

    if (userId && channel.server.id && channel.channel.id && target) {
        channel.server.name = await utils.getServerDisplayName(channel.server.id);
        channel.channel.name = await utils.getChannelDisplayName(channel.channel.id);

        const status = await createGizzz(
            { id: userId, name: (await utils.getUserDisplayName(userId)) || 'not found' },
            channel,
            target,
        );
        if (status.success) {
            res.send(utils.getResponse(ResStatus.Success, status.message));
        } else {
            res.status(400).send(utils.getResponse(ResStatus.Error, status.message));
        }
    } else {
        res.send(utils.getResponse(ResStatus.Empty));
    }
};

export const join = async (req: express.Request, res: express.Response): Promise<void> => {
    const gizzzId = req.params.id;
    const userId = req.headers.authorization ? getAuthenticatedUser(req.headers.authorization) : undefined;
    if (userId && gizzzId) {
        if (await joinSquad({ id: userId, name: (await utils.getUserDisplayName(userId)) || 'not found' }, gizzzId)) {
            res.sendStatus(200);
        } else {
            res.status(400).send(utils.getResponse(ResStatus.Error));
        }
    } else {
        res.status(400).send(utils.getResponse(ResStatus.Error));
    }
};

export const leave = async (req: express.Request, res: express.Response): Promise<void> => {
    const gizzzId = req.params.id;
    const userId = req.headers.authorization ? getAuthenticatedUser(req.headers.authorization) : undefined;
    if (userId && gizzzId) {
        if (await leaveSquad({ id: userId, name: (await utils.getUserDisplayName(userId)) || 'not found' }, gizzzId)) {
            res.sendStatus(200);
        } else {
            res.status(400).send(utils.getResponse(ResStatus.Error));
        }
    } else {
        res.status(400).send(utils.getResponse(ResStatus.Error));
    }
};

export const cancel = async (req: express.Request, res: express.Response): Promise<void> => {
    const gizzzId = req.params.id;
    const userId = req.headers.authorization ? getAuthenticatedUser(req.headers.authorization) : undefined;
    if (gizzzId && userId) {
        if (await cancelGizzz(gizzzId, { id: userId, name: (await utils.getUserDisplayName(userId)) || 'not found' })) {
            res.sendStatus(200);
        } else {
            res.status(400).send(utils.getResponse(ResStatus.Error));
        }
    } else {
        res.status(400).send(utils.getResponse(ResStatus.Error));
    }
};
