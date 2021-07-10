import DiscChannel from '../discord/DiscChannel';
import Gizzz from './Gizzz';
import GizzzModel from '../model/GizzzModel';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import GizzzStatus from './GizzzStatus';
import DiscEvent from '../discord/DiscEvent';
//import { io } from '../app';
import GizzzType from './GizzzType';
import * as utils from '../common/utils';
dotenv.config();

mongoose
    .connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PWD}@${process.env.DB_PATH}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .catch((e) => console.log('mongoose connection failed', e));
mongoose.set('useFindAndModify', false);

export const createGizzz = async (
    ownerUserId: string,
    channel: DiscChannel,
    target: number,
    audience?: string[],
): Promise<string | undefined> => {
    if (!(await getGizzzHomeView(ownerUserId))) {
        const g = new Gizzz(
            GizzzStatus.Pending,
            ownerUserId,
            channel,
            target,
            [],
            utils.bot.getUserIdsByChannel(channel),
            audience,
        );
        const doc = new GizzzModel(g.serialize());
        doc.save();
        return doc._id;
    }
    return undefined;
};

export const joinSquad = async (userId: string, gizzzId: string): Promise<boolean> => {
    const doc = await GizzzModel.findById(gizzzId).exec();
    if (doc) {
        const g = new Gizzz(doc.status, doc.owner, doc.channel, doc.target, doc.squad, doc.others, doc.audience);
        if (g.status === GizzzStatus.Pending && g.isInAudience(userId) && !g.isSquadMember(userId)) {
            g.addSquadMember(userId);
            await updateGizzz(gizzzId, g);
            return true;
        }
    }
    return false;
};

export const leaveSquad = async (userId: string, gizzzId: string): Promise<boolean> => {
    const doc = await GizzzModel.findById(gizzzId).exec();
    if (doc) {
        const g = new Gizzz(doc.status, doc.owner, doc.channel, doc.target, doc.squad, doc.others, doc.audience);
        if (g.status === GizzzStatus.Pending && g.isSquadMember(userId)) {
            g.removeSquadMember(userId);
            await updateGizzz(gizzzId, g);
            return true;
        }
    }
    return false;
};

export const discordEventListener = async (event: DiscEvent): Promise<void> => {
    console.log(
        `User ${event.user} moved from ${JSON.stringify(event.oldChannel)} to ${JSON.stringify(event.newChannel)}}`,
    );
    if (event.oldChannel) {
        await processDiscordEvent(false, event.oldChannel, event.user);
    }
    if (event.newChannel) {
        const completedGizzzId = await processDiscordEvent(true, event.newChannel, event.user);
        if (completedGizzzId) {
            utils.getClient(event.user)?.volatile.emit('GizzzComplete', completedGizzzId);
        }
    }
};

const processDiscordEvent = async (
    join: boolean,
    channel: DiscChannel,
    userId: string,
): Promise<string | undefined> => {
    const doc = await GizzzModel.findOne({ channel: channel }).exec();
    if (doc) {
        const g = new Gizzz(doc.status, doc.owner, doc.channel, doc.target, doc.squad, doc.others, doc.audience);
        if (g.status === GizzzStatus.Pending) {
            if (g.isSquadMember(userId)) {
                g.updateSquadMember(userId, join);
            } else if (join) {
                g.addOthersMember(userId);
            } else {
                g.removeOthersMember(userId);
            }
            await updateGizzz(doc._id, g);
        }
        if (g.status === GizzzStatus.Complete) {
            return doc._id;
        }
    }
    return;
};

export const getGizzzHomeView = async (userId: string): Promise<false | GizzzType[]> => {
    /* 
    home view:
    1. own, pending gizzz
    2. others' pending gizzz joined
    3. others' pending gizzz not joined
    3. last own completed gizzz
    */
    const result = [];
    const own = await GizzzModel.findOne({ owner: userId, status: 0 });
    if (own) {
        const g = new Gizzz(own.status, own.owner, own.channel, own.target, own.squad, own.others, own.audience);
        result.push(g.serialize());
    }

    return result.length > 0 ? result : false;
};

const updateGizzz = async (gizzzId: string, g: Gizzz): Promise<void> => {
    const doc = await GizzzModel.findOneAndUpdate({ _id: gizzzId }, g.serialize());
    doc.save();
};
