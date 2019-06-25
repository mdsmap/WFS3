const fs = require('fs');
const sqlite = require('sqlite3');
const path = "data/"

const getMetadata = (dataset) => {

    const arrayToObject = rows => rows.reduce((acc,cur)=> {
        acc[cur.name] = cur.value;
        return acc;
      }, {});

    return new Promise( (resolve, reject)=> {
        const db = new sqlite.Database(path+dataset+".mbtiles",sqlite.OPEN_READWRITE, (err=> {if(err) reject(err)}));
        const sql = "SELECT * from metadata";
        db.all(sql, (err, rows) =>{
            if (err) reject(err);
            else resolve([dataset,arrayToObject(rows)]);
        });
    });
};

const formatData = (req,dataset) => {
    const fileFormat = {
        "png": "image/png",
        "jpg": "image/jpeg",
        "webp": "image/webp",
        "pbf": "application/vnd.mapbox-vector-tile"
    }

    return {
        "name": dataset[1].name,
        "title":dataset[1].description,
        "extent": {
            "spatial": dataset[1].bounds.split(",").map(e=>Number(e))
        },
        "links": [{
            "href" : req.headers.host+"/collections/"+dataset[0]+"/tiles",
            "rel": "tilingScheme",
            "type": "application/json",
            "title": dataset[1].name+ " associated tiling schemes."
        },{
            "href" : req.headers.host+"/collections/"+ dataset[0]+"/tiles/{tilingSchemeId}/{level}/{row}/{col}",
            "rel": "tiles",
            "type": dataset[1].format,
            "title": dataset[1].name+ " as " + dataset[1].format + ". The link is a URI template where {tilingSchemeId} is one of the schemes listed in the 'tilingSchemes' resource, and {level}/{row}/{col} the tile based on the tiling scheme. "
        }]
    }
}

const getGeoJSON = (dataset,options) => {
    const where = options.PK_UID? "WHERE PK_UID="+options.PK_UID:"";
    const limit = options.limit? " LIMIT "+options.limit:"";
    const sql = "SELECT *, AsGeoJSON(geom,6) as geojson FROM data "+where+limit;

    const db = new sqlite.Database(path+dataset+'.mbtiles',sqlite.OPEN_READWRITE, (err=> {if(err) reject(err)}));
    
    return new Promise( (resolve, reject)=> {
            db.all(sql, (err, rows) =>{
                if (err) reject(err);
                else resolve(rows.map(row=>{
                    const { geojson, geom, ...properties } = row;
                    return {
                        "type": "Feature",
                        "properties": properties,
                        "geometry": JSON.parse(geojson)
                    }
                }));
            });
    });
};

const fetchTile = (dataset,z,x,y) => {
    const db = new sqlite.Database(path+dataset+'.mbtiles',sqlite.OPEN_READWRITE, (err=> {if(err) reject(err)}));
    const sql = `SELECT tile_data FROM tiles WHERE zoom_level=${z} and tile_column=${y} and tile_row=${x}`;
    return new Promise( (resolve, reject)=> {
        db.get(sql, (err,row)=>{
            const data = typeof row == "undefined"? "tile not found": row.tile_data;
            if (err) reject(err);
            else resolve(data);
        })
    });
}

async function getDatasets(req) {
    const getData = async (files) => await Promise.all(files.map(item =>  getMetadata(item.split(".")[0])))
    const formatDatasets = async datasets => datasets.map(dataset=> formatData(req,dataset));

    const files = await fs.readdirSync(path).filter(dataset=>dataset.includes("mbtiles"));   
    const datasets = await getData(files);

    return await formatDatasets(datasets);
}


async function getDataset(req) {
    const metadata = await getMetadata(req.params.collectionId);

    return formatData(req,metadata)
}


async function getFeatures(collectionId,limit) {
    return { 
             "type": "FeatureCollection",
             "features": await getGeoJSON(collectionId,{limit:limit})
           }
}

async function getFeature(collectionId,featureId) {
    return { 
        "type": "FeatureCollection",
        "features": await getGeoJSON(collectionId,{PK_UID:featureId})
      }
}

async function getTile(collectionId,z,x,y) {
    return await fetchTile(collectionId,z,x,y)
}


module.exports = {
    getDatasets,
    getDataset,
    getFeatures,
    getFeature,
    getTile
};