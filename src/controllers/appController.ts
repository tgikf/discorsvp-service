import express from 'express';
import { getCurrentGizzz } from '../gizzz/gizzzHandler';
import * as utils from '../common/utils';
import ResStatus from './ResStatus';

export const getHome = async (req: express.Request, res: express.Response): Promise<void> => {
    const user = req.params.id;
    if (user) {
        const pendingGizzz = await getCurrentGizzz(user);
        res.send(
            pendingGizzz ? utils.getResponse(ResStatus.Success, pendingGizzz) : utils.getResponse(ResStatus.Empty),
        );
    } else {
        res.send(utils.getResponse(ResStatus.Empty));
    }
};
