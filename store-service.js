const Sequelize = require('sequelize');

// Parse the connection string
const connectionString = 'postgresql://bakuvi_owner:Xl8HqnTAw4yG@ep-silent-shape-a43otz89.us-east-1.aws.neon.tech/bakuvi?sslmode=require';
const match = connectionString.match(/postgresql:\/\/([^:]+):([^@]+)@([^:\/]+)\/([^?]+)/);

const database = match[4];
const username = match[1];
const password = match[2];
const host = match[3];

const sequelize = new Sequelize(database, username, password, {
    host: host,
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    query: { raw: true }
});

// Define models
const Item = sequelize.define('Item', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN,
    price: Sequelize.DOUBLE
});

const Category = sequelize.define('Category', {
    category: Sequelize.STRING
});

Item.belongsTo(Category, { foreignKey: 'category' });

// Initialize the database
module.exports.initialize = function() {
    return new Promise((resolve, reject) => {
        sequelize.sync()
            .then(() => resolve())
            .catch(err => reject("unable to sync the database"));
    });
};

module.exports.getAllItems = function() {
    return new Promise((resolve, reject) => {
        Item.findAll()
            .then(data => resolve(data))
            .catch(err => reject("no results returned"));
    });
};

module.exports.getPublishedItems = function() {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: { published: true }
        })
            .then(data => resolve(data))
            .catch(err => reject("no results returned"));
    });
};

module.exports.getCategories = function() {
    return new Promise((resolve, reject) => {
        Category.findAll()
            .then(data => resolve(data))
            .catch(err => reject("no results returned"));
    });
};

module.exports.addItem = function(itemData) {
    return new Promise((resolve, reject) => {
        console.log("Adding item:", itemData);  // Debug log
        itemData.published = itemData.published ? true : false;
        itemData.postDate = new Date();
        Item.create(itemData)
            .then(() => resolve())
            .catch(err => {
                console.error("Error creating item:", err);  // Debug log
                reject("unable to create item");
            });
    });
};

module.exports.getItemsByCategory = function(category) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: { category: category }
        })
            .then(data => resolve(data))
            .catch(err => reject("no results returned"));
    });
};

module.exports.getItemsByMinDate = function(minDateStr) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                postDate: {
                    [Sequelize.Op.gte]: new Date(minDateStr)
                }
            }
        })
            .then(data => resolve(data))
            .catch(err => reject("no results returned"));
    });
};

module.exports.getItemById = function(id) {
    return new Promise((resolve, reject) => {
        Item.findByPk(id)
            .then(data => resolve(data))
            .catch(err => reject("no result returned"));
    });
};

module.exports.getPublishedItemsByCategory = function(category) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                published: true,
                category: category
            }
        })
            .then(data => resolve(data))
            .catch(err => reject("no results returned"));
    });
};

module.exports.addCategory = function(categoryData) {
    return new Promise((resolve, reject) => {
        Category.create(categoryData)
            .then(() => resolve())
            .catch(err => reject("unable to create category"));
    });
};

module.exports.deleteCategoryById = function(id) {
    return new Promise((resolve, reject) => {
        Category.destroy({
            where: { id: id }
        })
            .then(() => resolve())
            .catch(err => reject("unable to remove category / category not found"));
    });
};

module.exports.deletePostById = function(id) {
    return new Promise((resolve, reject) => {
        Item.destroy({
            where: { id: id }
        })
            .then(() => resolve())
            .catch(err => reject("unable to remove post / post not found"));
    });
};