# DiscoRSVP

> The name DiscoRSVP is a combination of Discord, a popular VoIP tool among gamers, and `RSVP`, an initialism derived from the French phrase Répondez s'il vous plaît, literally meaning "Respond, If-You-Please", or just "Please Respond", to require confirmation of an invitation.

## What even is this?

Do you enjoy ganging up with your friends in Discord channels when playing video games? \
Do you have terrible friends that seemingly accept your invite to play but don't actually show up? \
Are you fed up with getting baited? \
Then **DiscoRSVP** is for you!

DiscoRSVP is a pet project that allows you to announce gaming sessions and tie them to a specific Discord channel. The app will track attendance on the selected channel and notify your Squad when everybody is there.

## DiscoRSVP-service

This repository contains the backend of DiscoRSVP, referred to as `discorsvp-service`.
It's a Node.js project implemented in TypeScript that consists of:

-   A Firestore database storage layer
-   A `socket.io` based websocket to communicate with clients
-   A Discord bot to track attendance on Discord servers
