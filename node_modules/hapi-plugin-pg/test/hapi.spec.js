'use strict';

const Lab = require('lab');
const Code = require('code');
const Hapi = require('hapi');
const Proxyquire = require('proxyquire');
const Pkg = require('../package.json');
const lab = exports.lab = Lab.script();


lab.describe('Hapi', () => {
  let server;

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

  lab.describe('call connection', () => {
    lab.test('It should registers the plugin', (done) => {
      const stub = {
        pg: {}
      };
      const realConnect = stub.pg.connect;

      stub.pg.connect = function (connection, callback) {

        stub.pg.connect = realConnect;

        callback(null, {}, () => {});
      };
      const Plugin = Proxyquire('../', {
        'pg': {}
      });
      server.register(Plugin, (err) => {

        Code.expect(err).to.not.exist();

        done();
      });
    });
  });
  lab.describe('Validate options', () => {
    lab.test('It should successfully uses native bindings without error', (done) => {
      const stubPool = function (options) {
        this.options = options;
      };
      stubPool.prototype.getOptions = function () {
        return this.options;
      };
      stubPool.prototype.on = function (event) {};
      stubPool.prototype.connect = function (cb) {
        return cb(null, {}, () => {});
      };

      const Plugin = Proxyquire('../', {
        'pg': {
          Pool: stubPool
        }
      });
      const pluginWithConfig = {
        register: Plugin,
        options: {
          connectionString: 'postgres://postgres:mysecretpassword@localhost/hapi_node_postgres'
        }
      };

      server.register(pluginWithConfig, (err) => {
        Code.expect(err).to.not.exist();
        server.inject(request, (response) => {
          Code.expect(response.statusCode).to.equal(200);
          done();
        });
      });
    });
  });
  lab.describe('When using user/password/host/port/database', () => {
    lab.it('Should register the plugin', (done) => {
      const stubPool = function (options) {
        this.options = options;
      };
      stubPool.prototype.getOptions = function () {
        return this.options;
      };
      stubPool.prototype.on = function (event) {};
      stubPool.prototype.connect = function (cb) {
        return cb(null, {}, () => {});
      };

      const Plugin = Proxyquire('../', {
        'pg': {
          Pool: stubPool
        }
      });
      const pluginWithConfig = {
        register: Plugin,
        options: {
          user: 'test',
          password: 'text',
          host: 'localhost',
          database: 'test_db'
        }
      };
      server.register(pluginWithConfig, (err) => {
        Code.expect(err).to.not.exist();
        server.inject(request, (response) => {
          Code.expect(response.statusCode).to.equal(200);
          done();
        });
      });
    });
  });
});
