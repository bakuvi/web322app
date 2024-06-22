/*********************************************************************************
 *  WEB322 – Assignment 03
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part
 *  of this assignment has been copied manually or electronically from any other source
 *  (including 3rd party web sites) or distributed to other students.
 *
 *  Name: _emin feyziyev_____________________ Student ID:150187227 ______________ Date: ________________
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

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.redirect('/about');
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'about.html'));
});

app.get('/items/add', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'addItem.html'));
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
            .then(data => res.json(data))
            .catch(err => res.status(500).json({ message: err }));
    } else if (req.query.minDate) {
        storeService.getItemsByMinDate(req.query.minDate)
            .then(data => res.json(data))
            .catch(err => res.status(500).json({ message: err }));
    } else {
        storeService.getAllItems()
            .then(data => res.json(data))
            .catch(err => res.status(500).json({ message: err }));
    }
});

app.get('/item/:id', (req, res) => {
    storeService.getItemById(req.params.id)
        .then(data => res.json(data))
        .catch(err => res.status(500).json({ message: err }));
});

app.get('/shop', (req, res) => {
    storeService.getPublishedItems()
        .then(data => {
            res.json(data);
        })
        .catch(err => {
            res.status(500).json({ message: err });
        });
});

app.get('/categories', (req, res) => {
    storeService.getCategories()
        .then(data => {
            res.json(data);
        })
        .catch(err => {
            res.status(500).json({ message: err });
        });
});

app.use((req, res) => {
    res.status(404).send('Page Not Found');
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