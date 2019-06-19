require('dotenv').config()

const express = require('express');
const es6Renderer = require('express-es6-template-engine');
const cors = require('cors');
const cookieParser = require('cookie-parser')

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(cors());
app.use(cookieParser())

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.engine('html', es6Renderer);
app.set('view engine', 'html');
app.set('views', 'views');
app.use('/views', express.static(__dirname + '/views/'));


// api routes
app.get('/', (req, res)=>{res.render('index')});
app.get('/api', (req, res)=>{res.sendFile(__dirname + '/views/api.yaml')});

app.get('/conformance',  (req, res) =>{ res.json({ "conformsTo": [ "http://www.opengis.net/spec/wfs-1/3.0/req/core", "http://www.opengis.net/spec/wfs-1/3.0/req/oas30", "http://www.opengis.net/spec/wfs-1/3.0/req/html", "http://www.opengis.net/spec/wfs-1/3.0/req/geojson" ] }) });

app.use('/collections', require('./collections/collections.controller'));

app.get('/tilingschemes',  (req, res) =>{ res.json({ "tilingSchemes": [ "GoogleMapsCompatible" ] }) });

//app.use('/styles', require('./styles/styles.controller'));

// start server
process.env.PORT = process.env.PORT || 3000;

app.listen(process.env.PORT, () =>
    console.log(`Application started on http://localhost:${process.env.PORT}`)
);


