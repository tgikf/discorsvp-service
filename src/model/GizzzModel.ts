import mongoose from 'mongoose';

const gizzzSchema = new mongoose.Schema({
    status: Number,
    owner: String,
    channel: { server: String, channel: String },
    target: Number,
    audience: [String],
    squad: [{ memberId: String, hasJoined: Boolean }],
    others: [String],
});

const GizzzModel = mongoose.model('Gizzz', gizzzSchema);

export default GizzzModel;
