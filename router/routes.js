const express = require("express").Router();
const pageController = require("../controller/pageController");

app.post("/delete-page", async (request, result) => {
    var url = request.fields.url;

    await database.collection("pages").deleteOne({
        "url": url
    });
    io.emit("page_deleted", url);

    var backURL = request.header('Referer') || '/';
    result.redirect(backURL);
});

app.get("/page/:url", async (request, result) => {
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

app.post("/crawl-page", async (request, result) => {
    var url = request.fields.url;
    crawlPage(url);

    result.json({
        "status": "success",
        "message": "Page has been crawled",
        "url": url
    });
});

app.get("/", async (request, result) => {

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


module.exports = router;