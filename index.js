// Express is node framework
const express = require('express');

// bodyParser parsers is the incoming JSON from incoming requests 
const bodyParser = require('body-parser');

// jwsonwebtoken is what we use to encode and decode objs
const jwt = require('jsonwebtoken');

//bcrypt is used to encode and decode password
/*const bcrypt = require('bcrypt');*/

const cors = require('cors');

// // NEW: MySQL database driver
const mysql = require('mysql2/promise');

const app = express();

// We import and immediately load the `.env` file
require('dotenv').config();

const port = process.env.PORT;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

app.use(async function mysqlConnection(req, res, next) {
    try {
      req.db = await pool.getConnection();
      req.db.connection.config.namedPlaceholders = true;
  
      // Traditional mode ensures not null is respected for unsupplied fields, ensures valid JavaScript dates, etc.
      await req.db.query('SET SESSION sql_mode = "TRADITIONAL"');
      await req.db.query(`SET time_zone = '-8:00'`);
  
      await next();
  
      req.db.release();
    } catch (err) {
      // If anything downstream throw an error, we must release the connection allocated for the request
      console.log(err)
      if (req.db) req.db.release();
      throw err;
    }
  });
  
  app.use(cors());
  
  app.use(bodyParser.json());

   // Jwt verification checks to see if there is an authorization header with a valid jwt in it.
/*app.use(async function verifyJwt(req, res, next) {
try {
    if (!req.headers.authorization) {
      throw(401, 'Invalid authorization');
    }
  
    const [scheme, token] = req.headers.authorization.split(' ');
  
    if (scheme !== 'Bearer') {
      throw(401, 'Invalid authorization');
    }
  
    
      const payload = jwt.verify(token, process.env.JWT_KEY);
  
      req.user = payload;
    } catch (err) {
      if (err.message && (err.message.toUpperCase() === 'INVALID TOKEN' || err.message.toUpperCase() === 'JWT EXPIRED')) {
  
        req.status = err.status || 500;
        req.body = err.message;
        req.app.emit('jwt-error', err, req);
      } else {
  
        throw((err.status || 500), err.message);
      }
      console.log(err)
    }
  
   await next();
   }); */

  app.get('/emails', async function(req, res) {
    try {
      console.log('/emails success!')

      res.json('/emails success!')
    } catch (err) {}
  })

  app.listen(port, () => console.log(`mail-data listening at http://localhost:${port}`));
