var mongodb = require("mongodb");
var mongoClient = mongodb.MongoClient;
var ObjectID = mongodb.ObjectID;

mongoClient.connect("mongodb://127.0.0.1", {
    useUnifiedTopology: true
}, function (error, client) {
    if (error) {
        throw error;
    }
    database = client.db("web_crawler");
    console.log("Database connected");
})

module.exports = mongoClient