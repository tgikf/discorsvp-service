import DiscChannel from '../discord/DiscChannel';
import Gizzz from './Gizzz';
import GizzzModel from '../model/GizzzModel';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import GizzzStatus from './GizzzStatus';
dotenv.config();

class GizzzDao {
    private constructor() {
        mongoose
            .connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PWD}@${process.env.DB_PATH}`, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            })
            .catch((e) => console.log('mongoose connection failed', e));
        mongoose.set('useFindAndModify', false);
    }

    private static _initialize = (() => {
        new GizzzDao();
    })();

    public static createGizzz(
        ownerUserId: string,
        channel: DiscChannel,
        target: number,
        others: string[],
        audience?: string[],
    ): string {
        const g = new Gizzz(GizzzStatus.Pending, ownerUserId, channel, target, [], others, audience);
        const doc = new GizzzModel(g.serialize());
        doc.save();
        return doc._id;
    }

    public static async acceptGizzz(userId: string, gizzzId: string): Promise<boolean> {
        console.log(gizzzId);
        const doc = await GizzzModel.findById(gizzzId).exec();
        if (doc) {
            const g = new Gizzz(doc.status, doc.owner, doc.channel, doc.target, doc.squad, doc.others, doc.audience);
            if (g.status === GizzzStatus.Pending && g.isInAudience(userId) && !g.isSquadMember(userId)) {
                g.addSquadMember(userId);
                await GizzzDao.updateGizzz(gizzzId, g);
                return true;
            }
        }
        return false;
    }

    public static async processDiscordEvent(join: boolean, channel: DiscChannel, userId: string): Promise<void> {
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
                await GizzzDao.updateGizzz(doc._id, g);
            }
            if (g.status === GizzzStatus.Complete) {
                console.log('GIZZ COMPLETE LETS FUCKING GO');
            }
        }
    }

    private static async updateGizzz(gizzzId: string, g: Gizzz) {
        const doc = await GizzzModel.findOneAndUpdate({ _id: gizzzId }, g.serialize());
        doc.save();
    }
}

export default GizzzDao;
