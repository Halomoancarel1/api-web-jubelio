# hapi-pg
Hapi.js plugin for postgres (Using PG 7.X.X)

[![Build Status](https://travis-ci.org/doron2402/hapi-pg.svg?branch=master)](https://travis-ci.org/doron2402/hapi-pg)


## Install

```bash
$ npm install hapi-plugin-pg
```

## Usage

### Register
- Register the plugin with username/password/host/port/database
```js
const plugin = {
  register: require('hapi-plugin-pg'),
  options: {
    user: 'username',
    password: 'password',
    port: 5432,
    host: 'localhost',
    database: 'test_db',
    attach: 'onPreHandler', // Hapi.js events
    detach: 'tail', // Hapi.js events
  }
};
```
- Register with connection String
```js
const plugin = {
  register: require('hapi-plugin-pg'),
  options: {
    connectionString: 'postgres://username:password@localhost/database',
  }
};
```
* Make sure to register the plugin with `connectionString` OR `user`/`password`/`host`/`port`/`database` not both! this will throw an error.
* attach event will ask from the Postgres pool for a connection.
* detach event will return the Postges connection to the pool.

### Query
- Using `request` object:
```js
request.pg.client.query(query, (err, result) => {
  if (err) {
    // do something
  }
  // result object
});
```
- Using the `server` object:
```js
server.plugins['hapi-plugin-pg'].pg.connect((err, client, done) => {
  if (err) {
    throw err
  }
  client.query('SELECT * FROM users WHERE id = $1', [1], (err, res) => {
    done();

    if (err) {
      console.log(err.stack)
    } else {
      console.log(res.rows[0])
    }
  });
});
```

## Example
```js
server.route({
  method: 'GET',
  path: '/{name}',
  config: {
    handler: (request, reply) => {
      // THIS IS ONLY EXAMPLE
      // Make sure to validate your params
      request.pg.client('SELECT * FROM users WHERE name = $1', [request.params.name], (err, res) => {
        request.pg.done();
        if (err) {
          return reply(err).code(500);
        }
        if (!res) {
          return reply('not found').code(404);
        }
        return reply(res).code(200);
      });
    }
  }
});
```


## Contribute

Feel free to create a pr just make sure to add tests


## License

MIT
