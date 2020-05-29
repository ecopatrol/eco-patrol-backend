const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser')
const cors = require('cors')
const mysqlService = require('./persistance/mysqlService')

app.use(cors());

app.use(bodyParser.json());

app.get('/', (req, res) => {
   mysqlService.init().then((result) => res.send(result)).catch((error) => res.send(error));
})

app.post('/auth', (req, res) => {
    mysqlService.auth(req.body).then((result) => {
        res.status(200).send();
    }).catch((error) => res.status(401).json(error));
});

app.post('/register', (req, res) => {
    mysqlService.register(req.body).then((result) => {
        res.status(200).send();
    }).catch((error) => res.status(500).json(error));
});

app.get('/reports', (req, res) => {
    mysqlService.getReports().then((result) => {
        res.status(200).send(result);
    }).catch((error) => res.status(500).json(error));
});

app.post('/report', (req, res) => {
    mysqlService.postReport(req.body).then((result) => {
       res.status(200).send(result);
    }).catch((error) => res.status(500).send(error));
});

app.put('/users/:username', (req, res) => {
    mysqlService.updateUserData(req.params.username, req.body).then((result) => {
       res.status(200).send(result);
    }).catch((error) => res.status(500).send(error));
});

app.get('/users/:username/awards', (req, res) => {
    mysqlService.getUserAwards(req).then((result) => {
        res.status(200).send(result);
    }).catch((error) => res.status(500).send(error));
});

app.post('/users/:username/:awardname', (req, res) => {
    mysqlService.postUserAward(req).then((result) => {
        res.status(200).send(result);
    }).catch((error) => res.status(500).send(error));
});

app.listen(port, () => {
    setTimeout(() => { mysqlService.init().then(() => {
        console.log(`eco-patrol-backend listening on port ${port}`);
    }).catch(error => mysqlService.init().then(() => console.log(`eco-patrol-backend listening on port ${port}`))
    .catch(error => console.log(error)))}, 50000);
})