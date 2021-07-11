import DiscChannel from '../discord/DiscChannel';
import Gizzz from './Gizzz';
import GizzzModel from '../model/GizzzModel';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import GizzzStatus from './GizzzStatus';
import DiscEvent from '../discord/DiscEvent';
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

const gizzzFactory = (doc: GizzzType): Gizzz =>
    new Gizzz(doc.status, doc.owner, doc.channel, doc.target, doc.squad, doc.others, doc._id, doc.audience);

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
            undefined,
            audience,
        );
        const doc = new GizzzModel(g.serialize());
        await doc.save();
        return doc._id;
    }
    return undefined;
};

export const joinSquad = async (userId: string, gizzzId: string): Promise<boolean> => {
    const doc = await GizzzModel.findById(gizzzId).exec();
    if (doc) {
        const g = gizzzFactory(doc);
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
        const g = gizzzFactory(doc);
        if (g.status === GizzzStatus.Pending && g.isSquadMember(userId)) {
            g.removeSquadMember(userId);
            await updateGizzz(gizzzId, g);
            return true;
        }
    }
    return false;
};

export const cancelGizzz = async (gizzzId: string, userId: string): Promise<boolean> => {
    const doc = await GizzzModel.findById(gizzzId).exec();
    if (doc) {
        const g = gizzzFactory(doc);
        if (g.owner === userId && g.status !== GizzzStatus.Complete) {
            g.status = GizzzStatus.Cancelled;
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
        const g = gizzzFactory(doc);
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
    3. last own non-pending gizzz
    */
    const result = [];
    const op = await GizzzModel.findOne({ owner: userId, status: 0 });
    if (op) {
        const g = gizzzFactory(op);
        result.push(g.serialize());
    }

    const pj = await GizzzModel.findOne({ status: 0, owner: { $ne: userId }, 'squad.member': userId });
    if (pj) {
        const g = gizzzFactory(pj);
        result.push(g.serialize());
    }

    const pnjList: GizzzType[] = await GizzzModel.find({
        status: 0,
        owner: { $ne: userId },
        'squad.member': { $ne: userId },
    });
    if (pnjList.length > 0) {
        pnjList.forEach((pnj) => {
            const g = gizzzFactory(pnj);
            result.push(g.serialize());
        });
    }

    const oc = await GizzzModel.findOne({ owner: userId, status: { $ne: 0 } });
    if (oc) {
        const g = new Gizzz(oc.status, oc.owner, oc.channel, oc.target, oc.squad, oc.others, oc.audience);
        result.push(g.serialize());
    }

    return result.length > 0 ? result : false;
};

const updateGizzz = async (gizzzId: string, g: Gizzz): Promise<void> => {
    const doc = await GizzzModel.findOneAndUpdate({ _id: gizzzId }, g.serialize());
    doc.save();
};
