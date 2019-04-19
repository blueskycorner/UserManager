'use strict';

var AWS = require('aws-sdk');

module.exports.addUserToGroup = (event, context, callback) => {
  // console.log("howdy!",event);
  var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
  var params = {
    GroupName: 'user', //The name of the group in you cognito user pool that you want to add the user to
    UserPoolId: event.userPoolId, 
    Username: event.userName 
  };
  console.log("UserPoolId: " + event.userPoolId);
  console.log("Username: " + event.userName);

  //some minimal checks to make sure the user was properly confirmed
  if(! (event.request.userAttributes["cognito:user_status"]==="CONFIRMED" && event.request.userAttributes.email_verified==="true") )
    callback("User was not properly confirmed and/or email not verified")
  cognitoidentityserviceprovider.adminAddUserToGroup(params, function(err, data) {
    if (err) {
      callback(err) // an error occurred
    }
    callback(null, event);           // successful response
  });  
};