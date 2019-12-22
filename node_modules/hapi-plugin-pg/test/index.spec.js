'use strict';

const Lab = require('lab');
const Code = require('code');
const Hapi = require('hapi');
const Proxyquire = require('proxyquire');
const Pkg = require('../package.json');

const lab = exports.lab = Lab.script();
let server;

lab.experiment.only('Plugin', () => {
  lab.beforeEach((done) => {
    server = new Hapi.Server();
    server.connection({ port: 0 });
    server.route({
      method: 'GET',
      path: '/',
      handler: function (req, reply) {

        if (req.query.kill) {
          req.pg.kill = true;
        }

        reply(`${Pkg.name}:${Pkg.version}`);
      }
    });
    done();
  });

  lab.describe('Connect function', () => {
    lab.test('it exposes a connect function `sever.plugins.hapi-plugin-pg.pg`', (done) => {

      class Pool {
        constructor(options) {
          this.options = options;
          this.connect = function (cb) {
            cb(null, {}, done);
          };
        }
        on(event) {
          return;
        }
      }

      const Plugin = Proxyquire('../', {
        'pg': { Pool }
      });
      server.register(Plugin, (err) => {

        const plugin = server.plugins[Pkg.name];

        Code.expect(err).to.not.exist();
        Code.expect(plugin.pg).to.exist();
        plugin.pg.connect((err, client, clientDone) => {

          Code.expect(err).to.not.exist();
          Code.expect(client).to.be.an.object();
          Code.expect(done).to.be.a.function();

          clientDone();
        });
      });
    });
  });
});
