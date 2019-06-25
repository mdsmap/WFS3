const express = require('express');
const router = express.Router();
const collectionsService = require('./collections.service');

const tiletype = require('@mapbox/tiletype')
const authorize = require('../_helpers/authorize')

router.get('/', featureCollections );
router.get('/:collectionId',  featureCollection );
router.get('/:collectionId/items/', retrieveItems );
router.get('/:collectionId/items/:featureId', retrieveItem );

router.get('/:collectionId/tiles',  (req, res) =>{ res.json({ "tilingSchemes": [ "GoogleMapsCompatible" ] }) });
router.get('/:collectionId/tiles/:tes/:z/:x/:y', retrieveTile );

module.exports = router;                


function featureCollections(req, res) {
	collectionsService.getCollections(req)
	.then(msg => res.json(msg) )
	.catch(err => res.status(400).json(err.message) )
}

function featureCollection(req, res) {
	collectionsService.getCollection(req)
	.then(msg => res.json(msg) )
	.catch(err => res.status(400).json(err.message) )
}

function retrieveItems(req, res) {
	collectionsService.getItems(req)
	.then(msg => res.json(msg) )
	.catch(err => res.status(400).json(err.message) )
}

function retrieveItem(req, res) {
	collectionsService.getItem(req)
	.then(msg => res.json(msg) )
	.catch(err => res.status(400).json(err.message) )
}

function retrieveTile(req, res) {
	collectionsService.getTile(req)
	.then((tile) =>{
		res.writeHead(200, tiletype.headers(tile))
		res.end(tile)
	})
	.catch(err => res.status(400).json(err.message) )
}