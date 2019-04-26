'use strict'

/**
 * Serverless API for users management
 * @author Benjamin EHLERS
 * @version 1.0.0
 * @license MIT
 */


// Require and init API router module
const app = require('lambda-api')({ version: 'v1.0', base: 'users/v1' })
const uuid = require('uuid');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const iopipeLib = require('@iopipe/iopipe');
const logger = require('@iopipe/logger');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const iopipe = iopipeLib({
  token: process.env.IOPIPE_TOKEN,
  plugins: [logger({ enabled: true })]
});

//----------------------------------------------------------------------------//
// Define Middleware
//----------------------------------------------------------------------------//

  // Add CORS Middleware
  app.use((req,res,next) => {

    // Add default CORS headers for every request
    res.cors()

    // Call next to continue processing
    next()
  })

//----------------------------------------------------------------------------//
// Build API routes
//----------------------------------------------------------------------------//

  // List
  app.get('/users', (req,res) => {
    const params = {
      TableName: process.env.TABLE_NAME,
    };
  
    // fetch user from the database
    dynamoDb.scan(params, (error, result) => {
      // handle potential errors
      if (error) {
        console.error(error);
        return res.status(501).send('Couldn\'t fetch the user.');
      }
  
      res.status(200).send(result.Items)
    });
  })

  // Get
  app.get('/users/:user_id', (req,res) => {
    console.log('user-id to be requested: ' + req.params.user_id);
    console.info("user id requesting: " + req.requestContext.authorizer.userId)

    if (req.params.user_id != req.requestContext.authorizer.userId) {
      console.error("user to be updated and requester don't match");
      return res.status(403).send('Forbidden');
    }

    const params = {
      TableName: process.env.TABLE_NAME,
      Key: {
        id: req.params.user_id,
      },
    };
  
    // fetch user from the database
    dynamoDb.get(params, (error, result) => {
      // handle potential errors
      if (error) {
        console.error(error);
        return res.status(501).send('Couldn\'t fetch the user.');
      }
  
      res.status(200).send(result.Item)
    });
  })

  // Post
  app.post('/users', (req,res) => {
    console.info("user id: " + req.requestContext.authorizer.userId)
    const timestamp = new Date().getTime();

    const params = {
      TableName: process.env.TABLE_NAME,
      Item: {
        id: req.requestContext.authorizer.userId,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    };

    // write the user to the database
    dynamoDb.put(params, (error) => {
      // handle potential errors
      if (error) {
        console.error(error);
        return res.status(501).send('Couldn\'t create the user.')
      }

      res.status(200).send(params.Item)
    });
  })

  // Put
  app.put('/users/:user_id', (req,res) => {
    console.log('user-id to be updated: ' + req.params.user_id);
    console.info("user id requesting: " + req.requestContext.authorizer.userId)

    if (req.params.user_id != req.requestContext.authorizer.userId) {
      console.error("user to be updated and requester don't match");
      return res.status(403).send('Forbidden');
    }
    const timestamp = new Date().getTime();
    
    const params = {
      TableName: process.env.TABLE_NAME,
      Key: {
        id: req.params.user_id,
      },
      ExpressionAttributeNames: {
        '#firstname': 'firstname',
        '#lastname': 'lastname',
      },
      ExpressionAttributeValues: {
        ':firstname': req.body.firstname,
        ':lastname': req.body.lastname,
        ':updatedAt': timestamp,
      },
      UpdateExpression: 'SET #firstname = :firstname, #lastname = :lastname, updatedAt = :updatedAt',
      ReturnValues: 'UPDATED_NEW',
    };
  
    // update the user in the database
    dynamoDb.update(params, (error, result) => {
      // handle potential errors
      if (error) {
        console.error(error);
        return res.status(501).send('Couldn\'t fetch the user.');
      }

      res.status(200).send(result.Attributes)
    });
  })


  // Delete
  app.delete('/users/:user_id', (req,res) => {
    console.log('user-id to be updated: ' + req.params.user_id);
    console.info("user id requesting: " + req.requestContext.authorizer.userId)

    if (req.params.user_id != req.requestContext.authorizer.userId) {
      console.error("user to be updated and requester don't match");
      return res.status(403).send('Forbidden');
    }

    const params = {
      TableName: process.env.TABLE_NAME,
      Key: {
        id: req.params.user_id,
      },
    };
  
    // delete the user from the database
    dynamoDb.delete(params, (error) => {
      // handle potential errors
      if (error) {
        console.error(error);
        return res.status(501).send('Couldn\'t remove the user.');
      }
  
      res.status(200).send({"result": "ok"})
    });
  })


  // Default Options for CORS preflight
  app.options('/*', (req,res) => {
    res.status(200).json({})
  })

//----------------------------------------------------------------------------//
// Main router handler
//----------------------------------------------------------------------------//
  module.exports.router = iopipe(
  function (event, context, callback) {
    console.info(app.routes());
    // !!!IMPORTANT: Set this flag to false, otherwise the lambda function
    // won't quit until all DB connections are closed, which is not good
    // if you want to freeze and reuse these connections
    context.callbackWaitsForEmptyEventLoop = false
  
    // Run the request
    app.run(event,context,callback)  
  }
);
