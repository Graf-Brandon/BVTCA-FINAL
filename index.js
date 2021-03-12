// Express is node framework
const express = require('express');

// bodyParser parsers is the incoming JSON from incoming requests 
const bodyParser = require('body-parser');

// jwsonwebtoken is what we use to encode and decode objs
const jwt = require('jsonwebtoken');

//bcrypt is used to encode and decode password
const bcrypt = require('bcrypt');

const cors = require('cors');

// // NEW: MySQL database driver
const mysql = require('mysql2/promise');
const { format } = require('mysql2/promise');

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

  app.post('/register', async function (req, res) {
    try {
      let user;
  
      // Hashes the password and inserts the info into the `user` table
      await bcrypt.hash(req.body.password, 10).then(async hash => {
        try {
          [user] = await req.db.query(`
            INSERT INTO user (email, fname, lname, password)
            VALUES (:email, :fname, :lname, :password);
          `, {
            email: req.body.email,
            fname: req.body.fname,
            lname: req.body.lname,
            password: hash
          });
  
          console.log('user', user)
        } catch (error) {
          res.json ('Error creating user')
          console.log('error', error)
        }
      });
  
      const encodedUser = jwt.sign(
        { 
          userId: user.insertId,
          ...req.body
        },
        process.env.JWT_KEY
      );
  
      res.json({
        data: encodedUser,
        error: false,
        msg: ''
      });
    } catch (err) {
      res.json ({
        data: null,
        error: true,
        msg:'Error Give It Another Go?'
        });  
        console.log('err', err)
      }
    });

  app.post('/log-in', async function (req, res) {
    try {
      const [[user]] = await req.db.query(`
        SELECT * FROM user WHERE email = :email
      `, {  
        email: req.body.email
      });
  
      if (!user) {
        res.json('Email/password not found');
      }
  
      const userPassword = `${user.password}`
  
      const compare = await bcrypt.compare(req.body.password, userPassword);
  
      console.log('compare', compare);
  
      if (compare) {
        const payload = {
          email: user.email,
          fname: user.fname,
          lname: user.lname,
          role: 4
        }
        
        const encodedUser = jwt.sign(payload, process.env.JWT_KEY);
  
        res.json(encodedUser)
      } else {
        res.json('Email/password not found');
      }
    } catch (err) {
      res.json ('Error logging-in')
      console.log('Error in /auth', err)
    }
  })

   // Jwt verification checks to see if there is an authorization header with a valid jwt in it.
   app.use(async function verifyJwt(req, res, next) {
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
    }); 

  app.get('/emails', async function(req, res) {
    try {
      console.log('/emails success!', req.user);
      const [emails] = await req.db.query (' SELECT * FROM emails WHERE recipient = :userEmail',
      {
        userEmail: req.user.email
      }
    );

      res.json(emails);
    } catch (err) {
      console.log('Error in /emails');
      res.json ('Error fetching emails');      
    }
  });

  app.put('/email', async function(req, res) {
      try {
      await req.db.query(
        'INSERT INTO emails (sent, recipient, subject, body, time_stamp) VALUES ( :from, :recipient, :subject, :body, NOW())',
        {
          from: req.body.from,
          recipient: req.body.recipient,
          subject: req.body.subject,
          body: req.body.body
        }
      );
  
        res.json('/email success!')
      } catch (err) {
        console.log('Error in/ email, err');
        res.json ('Error sending email');
      } 
  });

  app.post('/emails', async function(req, res) {
    try {
      console.log('/emails success!');

      res.json('/emails success!')
    } catch (err) {

    } 
});

  app.delete('/emails', async function(req, res) {
  try {
    console.log('/emails success!');

    res.json('/emails success!')
  } catch (err) {

  } 
});

  app.listen(port, () => console.log(`mail-data listening at http://localhost:${port}`));
