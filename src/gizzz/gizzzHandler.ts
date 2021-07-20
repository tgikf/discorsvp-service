import DiscChannel from '../discord/DiscChannel';
import Gizzz from './Gizzz';
import GizzzModel from '../model/GizzzModel';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import GizzzStatus from './GizzzStatus';
import DiscEvent from '../discord/DiscEvent';
import GizzzType from './GizzzType';
import * as utils from '../common/utils';
import SquadMember from './SquadMember';
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
    owner: SquadMember,
    channel: DiscChannel,
    target: number,
    audience?: SquadMember[],
): Promise<{ success: boolean; message: string }> => {
    if (await GizzzModel.findOne({ 'owner.id': owner.id, status: 0 })) {
        return { success: false, message: 'You already have a pending Gizzz' };
    } else if (
        await GizzzModel.findOne({
            'channel.server.id': channel.server.id,
            'channel.channel.id': channel.channel.id,
            status: 0,
        })
    ) {
        return { success: false, message: 'This channel already has a pending Gizzz' };
    } else {
        const g = new Gizzz(
            GizzzStatus.Pending,
            owner,
            channel,
            target,
            [],
            utils.bot.getUserIdsByChannel(channel),
            undefined,
            audience,
        );
        const doc = new GizzzModel(g.serialize());
        await doc.save();
        triggerSocketUpdateEvent(g);
        return { success: true, message: doc._id };
    }
    return { success: false, message: 'unspecified' };
};

export const joinSquad = async (user: SquadMember, gizzzId: string): Promise<boolean> => {
    const doc = await GizzzModel.findById(gizzzId).exec();
    if (doc) {
        const g = gizzzFactory(doc);
        if (g.status === GizzzStatus.Pending && g.isInAudience(user) && !g.isSquadMember(user)) {
            g.addSquadMember(user);
            await updateGizzz(gizzzId, g);
            triggerSocketUpdateEvent(g);
            return true;
        }
    }
    return false;
};

export const leaveSquad = async (user: SquadMember, gizzzId: string): Promise<boolean> => {
    const doc = await GizzzModel.findById(gizzzId).exec();
    if (doc) {
        const g = gizzzFactory(doc);

        if (g.status === GizzzStatus.Pending && g.isSquadMember(user)) {
            g.removeSquadMember(user);
            await updateGizzz(gizzzId, g);
            triggerSocketUpdateEvent(g);
            return true;
        }
    }
    return false;
};

export const cancelGizzz = async (gizzzId: string, user: SquadMember): Promise<boolean> => {
    const doc = await GizzzModel.findById(gizzzId).exec();
    if (doc) {
        const g = gizzzFactory(doc);
        if (g.owner.id === user.id && g.status !== GizzzStatus.Complete) {
            g.status = GizzzStatus.Cancelled;
            await updateGizzz(gizzzId, g);
            triggerSocketUpdateEvent(g);
            return true;
        }
    }
    return false;
};

export const discordEventListener = async (event: DiscEvent): Promise<void> => {
    console.log(
        `User ${event.user.name} moved from ${JSON.stringify(event.oldChannel)} to ${JSON.stringify(
            event.newChannel,
        )}}`,
    );
    if (event.oldChannel) {
        await processDiscordEvent(false, event.oldChannel, event.user);
    }
    if (event.newChannel) {
        await processDiscordEvent(true, event.newChannel, event.user);
    }
};

const triggerSocketUpdateEvent = (g: Gizzz) => {
    utils.getConnectedClients().forEach((client) => {
        if (g.squad.find((member) => member.member.id === client && g.status === GizzzStatus.Complete)) {
            utils.getClient(client)?.volatile.emit('GizzzUpdate', g, true);
        } else {
            utils.getClient(client)?.volatile.emit('GizzzUpdate', g, false);
        }
    });
};

const processDiscordEvent = async (
    join: boolean,
    channel: DiscChannel,
    user: { id: string; name: string },
): Promise<void> => {
    const doc = await GizzzModel.findOne({
        'channel.server.id': channel.server.id,
        'channel.channel.id': channel.channel.id,
    }).exec();
    if (doc) {
        const g = gizzzFactory(doc);
        if (g.status === GizzzStatus.Pending) {
            console.log('herererer');
            if (g.isSquadMember(user)) {
                g.updateSquadMember(user, join);
            } else if (join) {
                g.addOthersMember(user);
            } else {
                g.removeOthersMember(user);
            }
            await updateGizzz(doc._id, g);
        }
        triggerSocketUpdateEvent(g);
    }
};

export const getGizzzHomeView = async (userId: string): Promise<false | GizzzType[]> => {
    /* 
    home view:
    1. any completed gizzz where user is a member
    2. own, pending gizzz
    3. others' pending gizzz joined
    4. others' pending gizzz not joined
    5. last own non-pending gizzz
    */
    const result = new Map<string, GizzzType>();

    const c = await GizzzModel.findOne({ 'squad.memer.id': userId, status: 1 });
    if (c) {
        const g = gizzzFactory(c);
        result.set(c.id, g.serialize());
    }

    const op = await GizzzModel.findOne({ 'owner.id': userId, status: 0 });
    if (op) {
        const g = gizzzFactory(op);
        result.set(op.id, g.serialize());
    }

    const pj = await GizzzModel.findOne({ status: 0, 'owner.id': { $ne: userId }, 'squad.memer.id': userId });
    if (pj) {
        const g = gizzzFactory(pj);
        result.set(pj.id, g.serialize());
    }

    const pnjList = await GizzzModel.find({
        status: 0,
        owner: { $ne: userId },
        'squad.member': { $ne: userId },
    });
    pnjList.forEach((pnj: any) => {
        if (pnj.id) {
            const g = gizzzFactory(pnj);
            result.set(pnj.id, g.serialize());
        }
    });

    const oc = await GizzzModel.findOne({ status: { $ne: 0 }, 'squad.member.id': userId });
    if (oc) {
        const g = gizzzFactory(oc);
        result.set(oc.id, g.serialize());
    }

    return Array.from(result.values());
};

const updateGizzz = async (gizzzId: string, g: Gizzz): Promise<void> => {
    const doc = await GizzzModel.findOneAndUpdate({ _id: gizzzId }, g.serialize());
    doc.save();
};
