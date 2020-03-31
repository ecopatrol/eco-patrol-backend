const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser')
const cors = require('cors')
const mysqlService = require('./persistance/mysqlService')

app.use(bodyParser.json());

app.use(cors());

app.get('/', (req, res) => {
    mysqlService.init().then((result) => res.send(result)).catch((error) => res.send(error));
})

app.post('/auth', (req, res) => {
    mysqlService.auth(req.body.username, req.body.password).then((result) => {
        res.status(200).send();
    }).catch((error) => res.status(401).json(error));
});

app.post('/register', (req, res) => {
    mysqlService.register(req.body.username, req.body.email, req.body.password).then((result) => {
        res.status(200).send();
    }).catch((error) => res.status(500).json(error));
});

app.listen(port, () => console.log(`eco-patrol-backend listening on port ${port}`))