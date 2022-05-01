import { cloudMessaging } from './connection';

const sendPush = async (messageText: string, targetDevices: string[]) => {
    if (targetDevices.length === 0) return;
    console.log(`Push triggered ${messageText}, for ${targetDevices}`);

    const message = {
        notification: {
            // title: 'Push title',
            body: messageText,
        },
        tokens: targetDevices,
    };
    const response = await cloudMessaging.sendMulticast(message);
    response.responses.forEach((r, i) => {
        if (!r.success) {
            console.log(`failed to send push to ${targetDevices[i]}`);
        }
    });
};

export default sendPush;
