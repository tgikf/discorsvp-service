import express from 'express';
import { getGizzByUserId } from '../gizzz/gizzzHandler';
import * as utils from './utils';

export const getHome = async (req: express.Request, res: express.Response): Promise<void> => {
    const { user } = utils.getUserAndId(req);
    const pendingGizzz = await getGizzByUserId(user);

    res.send(pendingGizzz ? utils.getResponse(ResStatus.Success, pendingGizzz) : utils.getResponse(ResStatus.Empty));
};
