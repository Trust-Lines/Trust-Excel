// Vercel Function: every /api/* request is rewritten here (see vercel.json)
// and handled by the NestJS app compiled to server/dist.
const { getServer } = require('../server/dist/serverless');

module.exports = async function handler(req, res) {
  const server = await getServer();
  return server(req, res);
};
