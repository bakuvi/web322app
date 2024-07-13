/*********************************************************************************
 *  WEB322 – Assignment 04
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part
 *  of this assignment has been copied manually or electronically from any other source
 *  (including 3rd party web sites) or distributed to other students.
 *
 *  Name: _emin feyziyev_____________________ Student ID:150187227 ______________ Date: ____jul12____________
 *
 *  Cyclic Web App URL: https://dulcet-starburst-cd44f9.netlify.app/
 *
 *  GitHub Repository URL:https://github.com/bakuvi/web322app
 *
 ********************************************************************************/



const express = require('express');
const path = require('path');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const exphbs = require('express-handlebars');
const storeService = require('./store-service');

const app = express();
const PORT = process.env.PORT || 8080;

cloudinary.config({
    cloud_name: 'bakuvi',
    api_key: '163289416868498',
    api_secret: 'j9sJMYP4yDFK_tvKuPiEXQAvUqU',
    secure: true
});

const upload = multer();

// Set up Handlebars
const hbs = exphbs.create({
    extname: '.hbs',
    helpers: {
        navLink: function (url, options) {
            return '<li' +
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
                '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }
    }
});

app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');

app.use(express.static(path.join(__dirname, 'public')));

// Middleware to set active route
app.use((req, res, next) => {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});

// Routes
app.get('/', (req, res) => {
    res.redirect('/shop');
});

app.get('/about', (req, res) => {
    res.render('about', { title: 'Emin Feyziyev\'s Store' });
});

app.get('/items/add', (req, res) => {
    res.render('addItem', { title: 'Add Item' });
});

app.post('/items/add', upload.single("featureImage"), async (req, res) => {
    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream((error, result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                });
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        let upload = async (req) => {
            let result = await streamUpload(req);
            return result;
        };

        upload(req).then((uploaded) => {
            processItem(uploaded.url);
        }).catch((err) => {
            console.error(err);
            res.status(500).send("Failed to upload image");
        });
    } else {
        processItem("");
    }

    function processItem(imageUrl) {
        req.body.featureImage = imageUrl;

        storeService.addItem(req.body).then(() => {
            res.redirect('/items');
        }).catch((err) => {
            res.status(500).send("Unable to add item");
        });
    }
});

app.get('/items', (req, res) => {
    if (req.query.category) {
        storeService.getItemsByCategory(req.query.category)
            .then(data => res.render('items', { items: data }))
            .catch(err => res.render('items', { message: "no results" }));
    } else if (req.query.minDate) {
        storeService.getItemsByMinDate(req.query.minDate)
            .then(data => res.render('items', { items: data }))
            .catch(err => res.render('items', { message: "no results" }));
    } else {
        storeService.getAllItems()
            .then(data => res.render('items', { items: data }))
            .catch(err => res.render('items', { message: "no results" }));
    }
});

app.get('/item/:id', (req, res) => {
    storeService.getItemById(req.params.id)
        .then(data => res.render('item', { item: data }))
        .catch(err => res.status(500).json({ message: err }));
});

app.get('/shop', (req, res) => {
    let viewData = {};

    storeService.getPublishedItems().then((items) => {
        viewData.posts = items;
        if (req.query.category) {
            return storeService.getPublishedItemsByCategory(req.query.category);
        } else {
            return storeService.getPublishedItems();
        }
    }).then((items) => {
        viewData.posts = items;
        return storeService.getCategories();
    }).then((categories) => {
        viewData.categories = categories;

        if (req.query.id) {
            return storeService.getItemById(req.query.id);
        } else if (viewData.posts.length > 0) {
            return storeService.getItemById(viewData.posts[0].id);
        } else {
            throw new Error('No items found');
        }
    }).then((post) => {
        viewData.post = post;
    }).catch((err) => {
        viewData.message = "no results";
    }).finally(() => {
        if (viewData.post) {
            viewData.post.body = viewData.post.body.replace(/(?:\r\n|\r|\n)/g, '<br />');
        }
        res.render('shop', {
            data: viewData,
            viewingCategory: req.query.category
        });
    });
});

app.get('/categories', (req, res) => {
    storeService.getCategories()
        .then(data => {
            res.render('categories', { categories: data });
        })
        .catch(err => {
            res.render('categories', { message: "no results" });
        });
});

app.use((req, res) => {
    res.status(404).render('404');
});

storeService.initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Express http server listening on ${PORT}`);
        });
    })
    .catch(err => {
        console.error(`Unable to start server: ${err}`);
    });

module.exports = app;