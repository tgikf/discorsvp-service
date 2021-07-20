import GizzzModel from '../model/GizzzModel';
import { discordEventListener, joinSquad, leaveSquad } from './gizzzHandler';

const shellChannel = {
    server: { id: 'someserver', name: 'someserver' },
    channel: { id: 'somechannel', name: 'somechannel' },
};
const shellOwner = { id: 'owner', name: 'owner' };
const shellMember = { id: 'member', name: 'member' };

jest.mock('../model/GizzzModel', () => ({
    findById: jest.fn().mockImplementation(() => {
        return {
            exec: () => {
                return {
                    _id: 'mockId',
                    status: 0,
                    owner: shellOwner,
                    channel: shellChannel,
                    target: 999,
                    squad: [{ member: shellMember, hasJoined: false }],
                    others: [],
                    id: '',
                    audience: [{ id: 'abc', name: 'abc' }],
                };
            },
        };
    }),
    findOne: jest.fn().mockImplementation(() => {
        return {
            exec: () => {
                return {
                    _id: 'mockId',
                    status: 0,
                    owner: shellOwner,
                    channel: shellChannel,
                    target: 2,
                    squad: [
                        { member: shellOwner, hasJoined: true },
                        { member: { id: 'abc', name: 'abc' }, hasJoined: false },
                    ],
                    others: [],
                    audience: [{ id: 'abc', name: 'abc' }],
                };
            },
        };
    }),
    findOneAndUpdate: jest.fn().mockImplementation(() => {
        return {
            save: () => {
                return;
            },
        };
    }),
}));

beforeEach(() => {
    jest.clearAllMocks();
});

describe('GizzzDao', () => {
    /*it('creates gizzz correctly', async () => {
        const id = await GizzzDao.createGizzz('owner', { server: 'abc', channel: 'def' }, 11, []);

        expect(id).toBeTruthy();
    });*/

    it('lets a user in the audience user join the squad', async () => {
        const status = await joinSquad({ id: 'abc', name: 'abc' }, 'irrelevant');

        expect(GizzzModel.findById).toHaveBeenCalledTimes(1);
        expect(GizzzModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
        expect(status).toBeTruthy();
    });

    it('does not let an invalid user join the squad', async () => {
        const status = await joinSquad({ id: 'def', name: 'def' }, 'abcdef');

        expect(GizzzModel.findById).toHaveBeenCalledTimes(1);
        expect(GizzzModel.findOneAndUpdate).toHaveBeenCalledTimes(0);
        expect(status).toBeFalsy();
    });

    it('lets a squad member leave the squad', async () => {
        const status = await leaveSquad(shellMember, 'irrelevant');
        expect(GizzzModel.findById).toHaveBeenCalledTimes(1);
        expect(GizzzModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
        expect(status).toBeTruthy();
    });

    it('does not let a non-member leave the squad', async () => {
        const status = await leaveSquad({ id: 'abc', name: 'abc' }, 'irrelevant');
        expect(GizzzModel.findById).toHaveBeenCalledTimes(1);
        expect(GizzzModel.findOneAndUpdate).not.toHaveBeenCalled();
        expect(status).toBeFalsy();
    });

    it('processes discord events correctly', async () => {
        await discordEventListener({
            user: { id: 'irrelevant', name: 'mocksquadmember' },
            oldChannel: {
                server: { id: 'oldserver', name: 'irrelevant' },
                channel: { id: 'oldchannel', name: 'irrelevant' },
            },
            newChannel: {
                server: { id: 'newserver', name: 'irrelevant' },
                channel: { id: 'newchannel', name: 'irrelevant' },
            },
        });
        expect(GizzzModel.findOne).toHaveBeenCalledTimes(2);
        expect(GizzzModel.findOneAndUpdate).toHaveBeenCalledTimes(2);
    });

    it('recognizes completed gizzz correctly', async () => {
        /* 
        this test only works because discordEventListener processes the leave event first
        and hence mocksquadmeber with hasJoined: false, will be set to hasJoined: false again
        only to be changed by the join event
        (this is because the findOne mock always returns the same channel)
        */
        await discordEventListener({
            user: { id: 'irrelevant', name: 'mocksquadmember' },
            oldChannel: {
                server: { id: 'irrelevant', name: 'irrelevant' },
                channel: { id: 'irrelevant', name: 'irrelevant' },
            },
            newChannel: {
                server: { id: 'irrelevant', name: 'irrelevant' },
                channel: { id: 'irrelevant', name: 'irrelevant' },
            },
        });
        expect(GizzzModel.findOne).toHaveBeenCalledTimes(2);
        expect(GizzzModel.findOneAndUpdate).toHaveBeenCalledTimes(2);
    });
});
