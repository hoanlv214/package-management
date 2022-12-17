const express = require("express");
const app = express();
const server = require("http").createServer(app);
const port = process.env.PORT || 3000;
// const db = require("./config/database");

// db.connect();

// set the view engine to ejs
app.set('view engine', 'ejs');
app.use("/public", express.static(__dirname + "/public"));

// set router
// const pageRouter = require("./router/routes");
// app.use(pageRouter);

const io = require("socket.io")(server, {
    "cors": {
        "origin": "*"
    }
});

const requestModule = require("request");
const cheerio = require('cheerio');

const formidableMiddleware = require('express-formidable');
app.use(formidableMiddleware());

var mongodb = require("mongodb");
var mongoClient = mongodb.MongoClient;
var ObjectID = mongodb.ObjectID;

var htmlspecialchars = require("htmlspecialchars");

var HTMLParser = require('node-html-parser');
var database = null;

function getTagContent(querySelector, content, pageUrl) {
    var tags = content.querySelectorAll(querySelector);
    var innerHTMLs = [];
    for (var a = 0; a < tags.length; a++) {
        var content = "";

        var anchorTag = tags[a].querySelector("a");
        if (anchorTag != null) {
            content = anchorTag.innerHTML;
        } else {
            content = tags[a].innerHTML;
        }

        content = content.replace(/\s+/g, ' ').trim();

        if (content.length > 0) {
            innerHTMLs.push(content);
        }
    }
    return innerHTMLs;
}

function crawlPage(url, callBack = null) {
    var pathArray = url.split('/');
    var protocol = pathArray[0];
    var host = pathArray[2];
    var baseUrl = protocol + '//' + host;

    io.emit("crawl_update", "Crawling page: " + url);

    requestModule(url, async function (error, response, html) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(html);
            // Get text 
            // console.log("------- with request module -------")
            // console.log($.text());
            // Get HTML 
            // console.log($.html());

            var page = await database.collection("pages").findOne({
                "url": url
            });
            if (page == null) {
                var html = $.html();
                var htmlContent = HTMLParser.parse(html);

                var allAnchors = htmlContent.querySelectorAll("a");
                var anchors = [];
                for (var a = 0; a < allAnchors.length; a++) {
                    var href = allAnchors[a].getAttribute("href");
                    var title = allAnchors[a].innerHTML;

                    var hasAnyChildTag = (allAnchors[a].querySelector("div") != null)
                        || (allAnchors[a].querySelector("img") != null)
                        || (allAnchors[a].querySelector("p") != null)
                        || (allAnchors[a].querySelector("span") != null)
                        || (allAnchors[a].querySelector("svg") != null)
                        || (allAnchors[a].querySelector("strong") != null);

                    if (hasAnyChildTag) {
                        continue;
                    }

                    if (href != null) {

                        if (href == "#" || href.search("javascript:void(0)") != -1) {
                            continue;
                        }

                        var first4Words = href.substring(0, 4);

                        if (href.search(url) == -1 && first4Words != "http") {
                            if (href[0] == "/") {
                                href = baseUrl + href;
                            } else {
                                href = baseUrl + "/" + href;
                            }
                        }

                        anchors.push({
                            "href": href,
                            "text": title
                        });
                    }
                }
                io.emit("crawl_update", htmlspecialchars("<a>") + " tags has been crawled");

                var titles = await getTagContent("title", htmlContent, url);
                var title = titles.length > 0 ? titles[0] : "";
                io.emit("crawl_update", htmlspecialchars("<title>") + " tag has been crawled");

                var h1s = await getTagContent("h1", htmlContent, url);
                io.emit("crawl_update", htmlspecialchars("<h1>") + " tags has been crawled");

                var h2s = await getTagContent("h2", htmlContent, url);
                io.emit("crawl_update", htmlspecialchars("<h2>") + " tags has been crawled");

                var h3s = await getTagContent("h3", htmlContent, url);
                io.emit("crawl_update", htmlspecialchars("<h3>") + " tags has been crawled");

                var h4s = await getTagContent("h4", htmlContent, url);
                io.emit("crawl_update", htmlspecialchars("<h4>") + " tags has been crawled");

                var h5s = await getTagContent("h5", htmlContent, url);
                io.emit("crawl_update", htmlspecialchars("<h5>") + " tags has been crawled");

                var h6s = await getTagContent("h6", htmlContent, url);
                io.emit("crawl_update", htmlspecialchars("<h6>") + " tags has been crawled");

                var ps = await getTagContent("p", htmlContent, url);
                io.emit("crawl_update", htmlspecialchars("<p>") + " tags has been crawled");

                var object = {
                    "url": url,
                    "anchors": anchors,
                    "title": title,
                    "h1s": h1s,
                    "h2s": h2s,
                    "h3s": h3s,
                    "h4s": h4s,
                    "h5s": h5s,
                    "h6s": h6s,
                    "ps": ps,
                    "time": new Date().getTime()
                };

                try {
                    await database.collection("pages").insertOne(object);
                } catch (e) {
                    console.log(e);
                }
                io.emit("page_crawled", object);
                io.emit("crawl_update", "Page crawled.");
            } else {
                io.emit("crawl_update", "Page already crawled.");
            }

            if (callBack != null) {
                callBack();
            }
        }
    });
}


var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

var mainURL = "http://localhost:3000";

server.listen(port, function () {
    console.log(`Server started running at ${port}` + mainURL);
    mongoClient.connect("mongodb://127.0.0.1", {
        useUnifiedTopology: true
    }, function (error, client) {
        if (error) {
            throw error;
        }
        database = client.db("web_crawler");
        console.log("Database connected");

        app.post("/reindex", async function (request, result) {
            var url = request.fields.url;

            await database.collection("pages").deleteOne({
                "url": url
            });
            io.emit("page_deleted", url);

            crawlPage(url, function () {
                var backURL = request.header('Referer') || '/';
                result.redirect(backURL);
            });
        });

        app.post("/delete-page", async function (request, result) {
            var url = request.fields.url;

            await database.collection("pages").deleteOne({
                "url": url
            });
            io.emit("page_deleted", url);

            var backURL = request.header('Referer') || '/';
            result.redirect(backURL);
        });

        app.get("/page/:url", async function (request, result) {
            var url = request.params.url;

            var page = await database.collection("pages").findOne({
                "url": url
            });
            if (page == null) {
                result.render("404", {
                    "message": "This page has not been crawled"
                });
                return false;
            }

            result.render("page", {
                "page": page
            });
        });

        app.post("/crawl-page", async function (request, result) {
            var url = request.fields.url;
            crawlPage(url);

            result.json({
                "status": "success",
                "message": "Page has been crawled",
                "url": url
            });
        });

        app.get("/", async function (request, result) {

            var pages = await database.collection("pages").find({})
                .sort({
                    "time": -1
                }).toArray();

            for (var index in pages) {
                var date = new Date(pages[index].time);
                var time = date.getDate() + " " + months[date.getMonth() + 1] + ", " + date.getFullYear() + " - " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

                pages[index].time = time;
            }

            result.render("index", {
                "pages": pages
            });
        });
    });
});