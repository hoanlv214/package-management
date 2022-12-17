const db = require("../config/database");

const Page = (page) => {
    this.id = page.id,
        this.url = page.url,
        this.title = page.title,
        this.h1s = page.h1s,
        this.h2s = page.h2s,
        this.h3s = page.h3s
};

