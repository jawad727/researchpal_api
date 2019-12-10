'use strict';
const AWS = require('aws-sdk')
const db = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10"})
const uuid = require("uuid/v4")


const postsTable = process.env.POSTS_TABLE
const usersTable = process.env.USERS_TABLE
const likesTable = process.env.LIKES_TABLE

// Create a response

function response(statusCode, message) {
  return {
    statusCode: statusCode,
    body: JSON.stringify(message),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    }
  }
}

// Create a post
module.exports.makePost = (event, context, callback) => {
  const reqBody = JSON.parse(event.body)

  const post = {

    uid: uuid(),
    userID: reqBody.userID,
    createdAt: new Date().toISOString(),
    PostName: reqBody.PostName,
    PostDescription: reqBody.PostDescription,
    PostCategory: reqBody.PostCategory,
    PostLikes: 0,
    PostImage: reqBody.PostImage,
    SiteURL: reqBody.SiteURL,
    Username: reqBody.Username,
    Comments: []
  }

  return db.put({
    TableName: postsTable,
    Item: post
  }).promise().then(() => {
    callback(null, response(201, post))
  })
  .catch(err => response(null, response(err.statusCode, err)));
}

// Create a User

module.exports.createUser = (event, context, callback) => {
  const reqBody = JSON.parse(event.body)

  const user = {
    uuid: reqBody.uuid,
    createdAt: new Date().toISOString(),
    Username: reqBody.Username,
    Email: reqBody.Email,
    PhoneNumber: reqBody.PhoneNumber,
    Profpic: "https://i.stack.imgur.com/34AD2.jpg",
    Header: "https://assets.tumblr.com/images/default_header/optica_pattern_11.png",
    DisplayName: reqBody.DisplayName,
    Bio: `Hi, I'm ${reqBody.Username} and I love to read interesting articles!`
  }

  return db.put({
    TableName: usersTable,
    Item: user
  }).promise().then(() => {
    callback(null, response(201, user))
  })
  .catch(err => response(null, response(err.statusCode, err)));
}

// Create a Like

module.exports.createliked = (event, context, callback) => {
  const reqBody = JSON.parse(event.body)

  const liked = { 
    id: reqBody.id,
    userid: reqBody.userid //likerID
  }

  return db.put({
    TableName: likesTable,
    Item: liked
  }).promise().then(() => {
    callback(null, response(201, liked))
  })
  .catch(err => response(null, response(err.statusCode, err)));
}

// Get all posts
module.exports.getAllPosts = (event, context, callback) => {
  return db.scan({
    TableName: postsTable
  }).promise()
  .then(res => {
    callback(null, response(201, res.Items))
  }).catch(err => callback(null, response(err.statusCode, err)))
} 

// Get all Users
module.exports.getAllUsers = (event, context, callback) => {
  return db.scan({
    TableName: usersTable
  }).promise()
  .then(res => {
    callback(null, response(201, res.Items))
  }).catch(err => callback(null, response(err.statusCode, err)))
} 

// Get a single post
module.exports.getSinglePost = (event, context, callback) => {
  const uid = event.pathParameters.uid;
  const params = {
    Key:{
      uid: uid
    },
    TableName: postsTable
  }
  return db.get(params).promise()
  .then(res => {
    if (res.Item) callback(null, response(200, res.Item)) 
    else callback(null, response(404, {error: "Post not found"})) 
  })
  .catch(err => callback(null, response(err.statusCode, err)))
}


// Get post by user
module.exports.getPostByUser = (event, context, callback) => {
  const theuser = event.pathParameters.uid;
  const params = {
    
    ExpressionAttributeNames: {
      "#userid": "userID"
    },
    ExpressionAttributeValues: {
      ":userid": theuser
    },
    FilterExpression: "#userid = :userid",
    TableName: postsTable
  }

  return db.scan(params)
  .promise()
  .then(res => {
    callback(null, response(200, res.Items))
  }).catch(err => callback(null, response(err.statusCode, err)))
}


// Get liked by user
module.exports.getLikeByUser = (event, context, callback) => {
  const theuser = event.pathParameters.uid;
  const params = {
    
    ExpressionAttributeNames: {
      "#userid": "userid"
    },
    ExpressionAttributeValues: {
      ":userid": theuser
    },
    FilterExpression: "#userid = :userid",
    TableName: likesTable
  }


  // var ItemsArray = {}






  return db.scan(params)
  .promise()
  .then(res => {

    
    
    var ItemsArray = res.Items.map(item => {
      return {"id": {
        S: item["id"]
      }}
    })
    
    var params = {
      RequestItems: {
        postsTable: {
          Keys: ItemsArray
        }
      }
    }

    callback(null, response(200, params))
    
    // return db.batchGetItem(params, function(err, data) {
    //   if (err) {return callback(null, response(400, err)) }
    //   else { return callback(null, response(200, data)) }       
    // })

  }).catch(err => callback(null, response(err.statusCode, err)))
}


// Update a post
module.exports.updatePost = (event, context, callback) => {
  const uid = event.pathParameters.id;
  const body = JSON.parse(event.body);
  const paramName = body.paramName;
  const paramValue = body.paramValue;

  const params = {
    Key: {
      uid: uid
    },
    TableName: postsTable,
    ConditionExpression: "attribute_exists(uid)",
    UpdateExpression: "set " + paramName + " = :v",
    ExpressionAttributeValues: {
      ":v": paramValue 
    },
    ReturnValue: "ALL_NEW"
  }

  return db.update(params)
  .promise()
  .then(res => {
    callback(null, response(200, res))
  })
  .catch(err => callback(null, response(err.statusCode, err)))
}


// Delete a post
module.exports.deletePost = (event, context, callback) => {
  const uid = event.pathParameters.id;
  const params = {
    Key: {
      uid: uid
    },
    TableName: postsTable
  }
  return db.delete(params)
  .promise()
  .then(() => callback(null, response(200, { message: "post deleted successfully" })))
  .catch(err => callback(null, response(err.statusCode, err)))
}