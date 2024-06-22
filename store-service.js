const fs = require('fs');
const path = require('path');

let items = [];
let categories = [];

function initialize() {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, 'data', 'items.json'), 'utf8', (err, data) => {
            if (err) {
                reject("unable to read file");
                return;
            }
            items = JSON.parse(data);

            fs.readFile(path.join(__dirname, 'data', 'categories.json'), 'utf8', (err, data) => {
                if (err) {
                    reject("unable to read file");
                    return;
                }
                categories = JSON.parse(data);
                resolve();
            });
        });
    });
}

function getAllItems() {
    return new Promise((resolve, reject) => {
        if (items.length === 0) {
            reject("no results returned");
        } else {
            resolve(items);
        }
    });
}

function getPublishedItems() {
    return new Promise((resolve, reject) => {
        const publishedItems = items.filter(item => item.published === true);
        if (publishedItems.length === 0) {
            reject("no results returned");
        } else {
            resolve(publishedItems);
        }
    });
}

function getCategories() {
    return new Promise((resolve, reject) => {
        if (categories.length === 0) {
            reject("no results returned");
        } else {
            resolve(categories);
        }
    });
}

module.exports = {
    initialize,
    getAllItems,
    getPublishedItems,
    getCategories
};
module.exports.addItem = function(itemData) {
    return new Promise((resolve, reject) => {
        if (itemData.published === undefined) {
            itemData.published = false;
        } else {
            itemData.published = true;
        }

        itemData.id = items.length + 1;
        items.push(itemData);
        resolve(itemData);
    });
};

module.exports.getItemsByCategory = function(category) {
    return new Promise((resolve, reject) => {
        let filteredItems = items.filter(item => item.category == category);
        if (filteredItems.length > 0) {
            resolve(filteredItems);
        } else {
            reject("no results returned");
        }
    });
};
module.exports.getItemsByMinDate = function(minDateStr) {
    return new Promise((resolve, reject) => {
        let filteredItems = items.filter(item => new Date(item.postDate) >= new Date(minDateStr));
        if (filteredItems.length > 0) {
            resolve(filteredItems);
        } else {
            reject("no results returned");
        }
    });
};

module.exports.getItemById = function(id) {
    return new Promise((resolve, reject) => {
        let foundItem = items.find(item => item.id == id);
        if (foundItem) {
            resolve(foundItem);
        } else {
            reject("no result returned");
        }
    });
};