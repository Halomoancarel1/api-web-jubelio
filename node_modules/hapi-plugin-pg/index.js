'use strict';

const Joi = require('joi');
const { Pool } = require('pg');

const ATTACH_EVENTS = ['onPreHandler', 'onRequest', 'onPreAuth', 'onPostAuth', 'onPostHandler', 'onPreResponse'];
const DETACH_EVENTS = ['response', 'tail', 'onPreResponse', 'onPostHandler'];
const schema = Joi.object({
  connectionString: [Joi.only(null).strip(), Joi.string()],
  attach: Joi.any().valid(ATTACH_EVENTS).default('onPreHandler'),
  detach: Joi.any().valid(DETACH_EVENTS).default('tail'),
  host: [Joi.only(null).strip(), Joi.string().hostname()],
  port: [Joi.only(null).strip(), Joi.number().integer().default(5432)],
  user: [Joi.only(null).strip(), Joi.string()],
  password: [Joi.only(null).strip(), Joi.string()],
  database: [Joi.only(null).strip(), Joi.string()]
}).without('connectionString', ['user', 'password', 'port', 'host', 'database']);


exports.register = function (server, options, next) {
  let config = null;
  Joi.validate(options, schema, { abortEarly: false, allowUnknown: true }, (err, value) => {
    if (err) {
      server.log(['error'], err);
      throw new Error('PosgreSQL config is not valid');
    }
    config = value;
  });

  const { user, host, database, password, port, connectionString } = config;
  // remove undefined from postgresSettings using JSON.parse(JSON.stringify(OBJ))
  const postgresSettings = JSON.parse(JSON.stringify({
    host,
    user,
    password,
    database,
    port,
    connectionString
  }));

  const pool = new Pool(postgresSettings);
  // On error kill the app
  pool.on('error', (err, client) => {
    server.log(['error'], 'Unexpected error on idle client', err);
    process.exit(-1);
  });

  server.expose('pg', pool);

  server.ext(config.attach, (request, reply) => {
    pool.connect((err, client, done) => {
      if (err) {
        server.log(['error'], err);
        return reply(err);
      }

      request.pg = { client, done, kill: false };

      return reply.continue();
    });
  });

  server.on(config.detach, (request, err) => {
    if (request.pg) {
      request.pg.done(request.pg.kill);
    }
  });

  next();
};


exports.register.attributes = {
  pkg: require('./package.json')
};
