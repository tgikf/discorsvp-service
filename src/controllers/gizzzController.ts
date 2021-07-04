import express from 'express';
import { bot } from '../app';
import Gizzz from '../gizzz/Gizzz';
import DiscEvent from '../discord/DiscEvent';

export const create = (req: express.Request, res: express.Response): void => {
    const validateCreateRequest = (req: express.Request) => {
        const { user, channel, target } = req.body;
        if (target > 1 && bot.getUserDisplayName(user)) {
            return { user, channel, target };
        }
    };

    const body = validateCreateRequest(req);
    if (body) {
        const gizzz = new Gizzz(body.user, body.channel, body.target);
        console.log(gizzz);
    } else {
        res.sendStatus(400);
    }
};

export const accept = (req: express.Request, res: express.Response): void => {
    const validateAcceptRequest = (req: express.Request) => {
        const { user, gizzzId } = req.body;
        if (bot.getUserDisplayName(user)) {
            return { user, gizzzId };
        }
    };

    const body = validateAcceptRequest(req);
    if (body) {
        console.log('gizzz accepted');
    } else {
        res.sendStatus(400);
    }
};

export const processGizzzEvent = (event: DiscEvent): void => {
    //needs to loop through all gizzz and see if any squad memeber can be changed to hasJoined
    console.log(
        `User ${bot.getUserDisplayName(event.user)} (${event.user}) moved from ${JSON.stringify(
            event.oldChannel,
        )} to ${JSON.stringify(event.newChannel)}}`,
    );
};
