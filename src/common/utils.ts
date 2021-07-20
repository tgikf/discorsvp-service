import { Socket } from 'socket.io';
import DiscBot from '../discord/DiscBot';
import ResStatus from '../controllers/ResStatus';
import DiscChannel from '../discord/DiscChannel';

export const bot = new DiscBot();

export const parseDiscUserId = (raw: string): string => {
    return raw ? raw.substr(15) : '';
};

export const getAuthenticatedUser = (token: string): string => {
    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return parseDiscUserId(decoded.sub);
};

export const getChannels = (): DiscChannel[] => bot.getAllChannelIds();

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

export const getUserDisplayName = async (id: string): Promise<string> => await bot.getUserDisplayName(id);

export const getServerDisplayName = async (id: string): Promise<string> => await bot.getServerDisplayName(id);

export const getChannelDisplayName = async (id: string): Promise<string> => await bot.getChannelDisplayName(id);
