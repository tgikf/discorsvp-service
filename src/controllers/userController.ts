import express from 'express';
import { bot } from '../app';

export const getChannels = (req: express.Request, res: express.Response): void => {
    const channels: { server: string; channels: string[] }[] = [];
    Array.from(bot.getAllChannelIds()).map((e) => {
        channels.push({ server: e[0], channels: e[1] });
    });

    res.send(channels);
};

export const getRating = (req: express.Request, res: express.Response): void => {
    res.send('NOT IMPLEMENTED: user/getRating');
};
