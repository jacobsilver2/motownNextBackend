// this file connects to the remote prisma db and gives us the abviliiy to query it with js

const { Prisma } = require("prisma-binding");
require('dotenv').config({path: '.env' })
const db = new Prisma({
  typeDefs: "generated/prisma.graphql",
  endpoint: process.env.PRISMA_ENDPOINT,
  secret: process.env.PRISMA_SECRET,	
  debug: false
});

module.exports = db;
