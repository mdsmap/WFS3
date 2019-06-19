const express = require('express');
const router = express.Router();
const authorize = require('../_helpers/authorize')

router.get('/', getTilingSchemes );

module.exports = router;                


function getTilingSchemes() {
	return {
        "tilingSchemes": [
          "GoogleMapsCompatible"
        ]
      }
}
