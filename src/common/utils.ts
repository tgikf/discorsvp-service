import { Socket } from 'socket.io';
import DiscBot from '../discord/DiscBot';
import ResStatus from '../controllers/ResStatus';

export const bot = new DiscBot();

export const parseDiscUserId = (raw: string): string => {
    return raw ? raw.substr(15) : '';
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
): { status: ResStatus; data: unknown | unknown[] } | { status: ResStatus } => {
    return data ? { status, data: data } : { status };
};

const clients = new Map<string, Socket>();
export const addClient = (userId: string, client: Socket): void => {
    clients.set(userId, client);
};

export const getClient = (userId: string): Socket | undefined => clients.get(userId);
