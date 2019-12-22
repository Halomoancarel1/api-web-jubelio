'use strict';

const Hapi = require('@hapi/hapi');
const axios = require('axios');
const uuidv4 = require('uuid/v4');
var parser = require('fast-xml-parser');
const Pool = require('pg').Pool
const pool = new Pool({
  user: 'postgres',
  host: '192.168.0.32',
  database: 'jubelio',
  password: 'admin',
  port: 5432,
})


const init = async () => {
    const server = Hapi.server({
    port: 6001,
    host: 'localhost',
    routes: {
        cors: {
          origin: ['*'],
          additionalHeaders: ['cache-control', 'x-requested-with']
            }
        }
    });


    server.route({
      method: 'GET',
      path: '/products',
      handler:async function(request, reply) {
      const result = await pool.query('SELECT * FROM product_detail ORDER BY id ASC');
      return result.rows;
      }
    });

    server.route({
      method: 'GET',
      path: '/productdetail/{sku}',
      handler:async function(request, reply) {
      const id = request.params.sku
      const resultDetail = await pool.query('SELECT * FROM product_detail WHERE product_code = $1', [id]);
      return resultDetail.rows[0];
      }
    });

    //post data to postgresql
    server.route({
      method: 'POST',
      path: '/postproduct',
      handler: async function(request, reply) {
        let returnValue = new Object();
        let id = uuidv4();
        const { product_name, product_code, product_url, product_desc, product_price } = request.payload
        console.log(id);
        let date = new Date();
        const insert = await pool.query('INSERT INTO product_detail (id, product_name, product_code, product_url, product_desc, product_price, created_date) VALUES ($1, $2, $3, $4, $5, $6, $7)', [id, product_name, product_code, product_url, product_desc, product_price, date], (error, results) => {
          if (error) {
            throw error
          }
        });
        let obj = {
          'status': 200,
          'message': 'Data berhasil disimpan'
        }
        return obj
      }
    });

    //update data from postgresql
    server.route({
      method: 'PUT',
      path: '/updateproduct',
      handler:async function(request, reply) {
          const {id, product_name, product_desc, product_price  } = request.payload
          let date = new Date();
          const update = await pool.query('UPDATE product_detail SET product_name = $2, product_desc = $3, product_price = $4, updated_date = $5  WHERE id = $1',  [id, product_name, product_desc, product_price, date ], (error, results) => {
            if (error) {
              throw error
            }
          });
          return ('Berhasil Update Data');
        }
    });

    //delete data from postgresql
    server.route({
      method: 'DELETE',
      path: '/deleteproduct',
      handler:async function(request, reply) {
          const {id  } = request.payload
          const update = await pool.query('DELETE from  product_detail where id = $1',  [id ], (error, results) => {
            if (error) {
              throw error
            }
          });
          return ('Berhasil Update Data');
        }
    });

    server.route({
        method: 'GET',
        path: '/{id}',
        handler: async (request, h) => {
            let returnValue = new Object();
            const AuthStr = '721407f393e84a28593374cc2b347a98';
            const result = await axios.get('http://api.elevenia.co.id/rest/prodservices/product/details/'+ request.params.id,  { headers: { openapikey: AuthStr } });

            var jsonObj = parser.parse(result.data);
            let productName = jsonObj.Product.prdNm;
            let productCode = jsonObj.Product.sellerPrdCd;
            let productImage = jsonObj.Product.prdImage01;
            let productDescription = jsonObj.Product.htmlDetail;
            let productPrice = jsonObj.Product.selPrc;

            returnValue.productname = productName;
            returnValue.productcode = productCode;
            returnValue.productimage = productImage;
            returnValue.productdescription = productDescription;
            returnValue.productprice = productPrice;

            let obj = {
              'status': 200,
              'message': 'Data ditemukan',
              'data': returnValue
            }
            return obj
        }
    });

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();
