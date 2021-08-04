import azure from 'azure-sb';

const service = azure.createNotificationHubService(
    'gizzz-push',
    'Endpoint=sb://ns-gizzz.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=5HGAM1wt2jSrlUfGBbOTjrPvF5gwdY6AnkFPVIRY6t4=',
);

export const pushToAndroid = (msg: string) => {
    service.gcm.send([], { data: { message: msg } }, (e) => {
        if (!e) {
            console.log('Push success');
        } else {
            console.error(e);
        }
    });
};
