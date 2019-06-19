const collectionsModel = require('./collections.model.sqlite');

async function getCollections(req) {
    return {
        "links": [
            {
            "href": req.headers.host+"/collections",
            "rel": "self",
            "type": "application/json",
            "title": "This document"
            }
        ],
        "collections": await collectionsModel.getDatasets(req)
    }
}

async function getCollection(req) {
    return await collectionsModel.getDataset(req)
}

async function getItems(req) {
    const limit = req.query.limit? req.query.limit:10;
    return await collectionsModel.getFeatures(req.params.collectionId,limit)
}

async function getItem(req) {
    return await collectionsModel.getFeature(req.params.collectionId,req.params.featureId)
}

async function getTile(req) {
    return await collectionsModel.getTile(req.params.collectionId,req.params.z,req.params.x,req.params.y)
}

module.exports = {
    getCollections,
    getCollection,
    getItems,
    getItem,
    getTile
};
