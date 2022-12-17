let page = async (req, res) => {
    res.render('page.ejs')
}

module.exports = {
    pageController: pageController
}