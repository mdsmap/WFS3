const fs = require('fs');
const sqlite = require('sqlite3');
const path = "data/"
const p = require('path')

const getMetadata = (dataset) => {
    const db = new sqlite.Database(path+dataset+".mbtiles");
    const sql = "SELECT * from metadata";
    const arrayToObject = rows => rows.reduce((acc,cur)=> {
        acc[cur.name] = cur.value;
        return acc;
      }, {});

    return new Promise( (resolve, reject)=> {
        db.all(sql, (err, rows) =>{
            if (err) reject(err);
            else resolve(arrayToObject(rows));
        });
    });
};

const formatData = (req,dataset) => {
    return {
        "name": dataset.name,
        "title":dataset.description,
        "extent": {
            "spatial": dataset.bounds.split(",")
        },
        "links": [{
            "href" : req.headers.host+"/collections/"+dataset.name+"/items",
            "rel": "item",
            "type": "application/geo+json",
            "title": dataset.name+ " items as application/geo+json"
        }]
    }
}

const getGeoJSON = (dataset,options) => {
    const where = options.PK_UID? "WHERE PK_UID="+options.PK_UID:"";
    const limit = options.limit? " LIMIT "+options.limit:"";
    const sql = "SELECT *, AsGeoJSON(geom,6) as geojson FROM data "+where+limit;

    const db = new sqlite.Database(path+dataset+'.mbtiles');
    
    return new Promise( (resolve, reject)=> {
        db.loadExtension('mod_spatialite.dll', (err)=> {
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
    });
};

const fetchTile = (dataset,z,x,y) => {
    const db = new sqlite.Database(path+dataset+'.mbtiles');
    const sql = `SELECT tile_data FROM tiles WHERE zoom_level=${z} and tile_column=${x} and tile_row=${y}`;

    return new Promise( (resolve, reject)=> {
        db.get(sql, (err,row)=>{
            const data = typeof row == "undefined"? "tile not found": row.tile_data;
            if (err) reject(err);
            else resolve(data);
        })

        /*new MBTiles(path+dataset+'.mbtiles?mode=ro', (err, mbtiles)=> {
            mbtiles.getTile(z, x, y, function(err, data, headers) {
                if (err) reject(err);
                else resolve(data);
          });
        });*/
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