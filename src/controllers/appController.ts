import express from 'express';
import { getGizzzHomeView } from '../gizzz/gizzzHandler';
import * as utils from '../common/utils';
import ResStatus from './ResStatus';
import { getAuthenticatedUser } from '../common/utils';

export const getHome = async (req: express.Request, res: express.Response): Promise<void> => {
    const user = req.headers.authorization ? getAuthenticatedUser(req.headers.authorization) : undefined;
    if (user) {
        const pendingGizzz = await getGizzzHomeView(user);
        res.send(
            pendingGizzz ? utils.getResponse(ResStatus.Success, pendingGizzz) : utils.getResponse(ResStatus.Empty),
        );
    } else {
        res.send(utils.getResponse(ResStatus.Empty));
    }
};
