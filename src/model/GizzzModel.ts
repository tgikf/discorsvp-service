import mongoose from 'mongoose';

const gizzzSchema = new mongoose.Schema({
    status: Number,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    owner: { id: String, name: String },
    channel: { server: { id: String, name: String }, channel: { id: String, name: String } },
    target: Number,
    audience: [{ id: String, name: String }],
    squad: [{ member: { id: String, name: String }, hasJoined: Boolean }],
    others: [{ id: String, name: String }],
});

const GizzzModel = mongoose.model('Gizzz', gizzzSchema);

export default GizzzModel;
