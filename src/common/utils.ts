import express from 'express';
import { Socket } from 'socket.io';
import DiscBot from '../discord/DiscBot';
import ResStatus from '../controllers/ResStatus';

export const bot = new DiscBot();

export const getUserAndId = (req: express.Request): { user: string; gizzzId: string } => {
    return { user: req.oidc.user?.sub.substr(15), gizzzId: req.params.id };
};

export const getChannels = (): { server: string; channels: string[] }[] => {
    const channels: { server: string; channels: string[] }[] = [];
    Array.from(bot.getAllChannelIds()).map((e) => {
        channels.push({ server: e[0], channels: e[1] });
    });
    return channels;
};

export const getResponse = (
    status: ResStatus,
    data?: unknown,
): { status: ResStatus; data: unknown[] } | { status: ResStatus; data: [] } => {
    return data ? { status, data: [data] } : { status, data: [] };
};

const clients = new Map<string, Socket>();
export const addClient = (userId: string, client: Socket): void => {
    clients.set(userId, client);
};

export const getClient = (userId: string): Socket | undefined => clients.get(userId);
