# gizzz-service
A Node.js project implemented in TypeScript consisting of
- a RESTful API backend service
- a discord bot that tracks user presence 

## Development environment set up
1. Clone repository and make sure Node.js (incl. NPM) is installed
2. Install dependencies with `npm i`
3. Make sure you have the environment variables set up (.env file):
- PORT
- DISC_TOKEN
- DB_USER
- DB_PWD
- DB_PATH
4. Run the app: `npm run dev` (watch mode) or `npm run start`
5. Run unit tests: `npm t` or `npm run test`

### Auto linting on save (VSCode)
  - Install the ESLint extension
  - Add the snippet below to settings.json:
```
"editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
}
```
