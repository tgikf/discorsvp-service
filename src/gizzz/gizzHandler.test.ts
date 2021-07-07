import GizzzModel from '../model/GizzzModel';
import { discordEventListener, joinSquad, leaveSquad } from './gizzzHandler';

jest.mock('../model/GizzzModel');

beforeAll(() => {
    jest.setTimeout(3 * 60 * 1000);
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe('GizzzDao', () => {
    GizzzModel.findById = jest.fn().mockImplementation(() => {
        return {
            exec: () => {
                return {
                    _id: 'mockId',
                    status: 0,
                    owner: 'own',
                    channel: { server: 'mocksrv', channel: 'mockchannel' },
                    target: 999,
                    squad: [{ memberId: 'mocksquadmember', hasJoined: false }],
                    others: [],
                    audience: ['abc'],
                };
            },
        };
    });

    GizzzModel.findOne = jest.fn().mockImplementation(() => {
        return {
            exec: () => {
                return {
                    _id: 'mockId',
                    status: 0,
                    owner: 'owner',
                    channel: { server: 'mocksrv', channel: 'mockchannel' },
                    target: 2,
                    squad: [
                        { memberId: 'owner', hasJoined: true },
                        { memberId: 'mocksquadmember', hasJoined: false },
                    ],
                    others: [],
                    audience: ['abc'],
                };
            },
        };
    });

    GizzzModel.findOneAndUpdate = jest.fn().mockImplementation(() => {
        return {
            save: () => {
                return;
            },
        };
    });

    /*it('creates gizzz correctly', async () => {
        const id = await GizzzDao.createGizzz('owner', { server: 'abc', channel: 'def' }, 11, []);

        expect(id).toBeTruthy();
    });*/

    it('lets a user in the audience user join the squad', async () => {
        const status = await joinSquad('abc', 'irrelevant');

        expect(GizzzModel.findById).toHaveBeenCalledTimes(1);
        expect(GizzzModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
        expect(status).toBeTruthy();
    });

    it('does not let an invalid user join the squad', async () => {
        const status = await joinSquad('def', 'abcdef');

        expect(GizzzModel.findById).toHaveBeenCalledTimes(1);
        expect(GizzzModel.findOneAndUpdate).toHaveBeenCalledTimes(0);
        expect(status).toBeFalsy();
    });

    it('lets a squad member leave the squad', async () => {
        const status = await leaveSquad('mocksquadmember', 'irrelevant');
        expect(GizzzModel.findById).toHaveBeenCalledTimes(1);
        expect(GizzzModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
        expect(status).toBeTruthy();
    });

    it('does not let a non-member leave the squad', async () => {
        const status = await leaveSquad('abc', 'irrelevant');
        expect(GizzzModel.findById).toHaveBeenCalledTimes(1);
        expect(GizzzModel.findOneAndUpdate).not.toHaveBeenCalled();
        expect(status).toBeFalsy();
    });

    it('processes discord events correctly', async () => {
        await discordEventListener({
            user: 'irrelevant',
            oldChannel: { server: 'oldserver', channel: 'oldserveroldchannel' },
            newChannel: { server: 'newserver', channel: 'newservernewchannel' },
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
            user: 'mocksquadmember',
            oldChannel: { server: 'irrelevant', channel: 'irrelevant' },
            newChannel: { server: 'irrelevant', channel: 'irrelevant' },
        });
        expect(GizzzModel.findOne).toHaveBeenCalledTimes(2);
        expect(GizzzModel.findOneAndUpdate).toHaveBeenCalledTimes(2);
    });
});
