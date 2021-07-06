import express from 'express';
import DiscEvent from '../discord/DiscEvent';
import GizzzDao from '../gizzz/GizzzDao';

export const create = (req: express.Request, res: express.Response): void => {
    const { user, channel, target } = req.body;
    if (user && channel && target) {
        //TODO fill others with users already in channel at creation time
        const gizzzId = GizzzDao.createGizzz(user, channel, target, []);
        res.send({ status: 'success', gizzzId });
    } else {
        res.sendStatus(400);
    }
};

export const accept = async (req: express.Request, res: express.Response): Promise<void> => {
    const { user, gizzzId } = req.body;
    if (user && gizzzId) {
        if (await GizzzDao.acceptGizzz(user, gizzzId)) {
            res.sendStatus(200);
        } else {
            res.sendStatus(400);
        }
    } else {
        res.sendStatus(400);
    }
};

export const processDiscordEvent = (event: DiscEvent): void => {
    console.log(
        `User ${event.user} moved from ${JSON.stringify(event.oldChannel)} to ${JSON.stringify(event.newChannel)}}`,
    );
    GizzzDao.processDiscordEvent(false, event.oldChannel, event.user);
    GizzzDao.processDiscordEvent(true, event.newChannel, event.user);
};
