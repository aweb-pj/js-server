'use strict'

const _ = require('lodash')
const moment = require('moment')
const low = require('lowdb')
const db = low('db.json')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const multer = require('multer')
const morgan = require('morgan')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))

const storage = multer.diskStorage({
  destination: 'material',
  filename: function (req, file, callback) {
    callback(null, _.join([req.params.nodeId, file.originalname.replace(/\s+/g, '_').toLowerCase()], '_'))
  }
})

const upload = multer({storage: storage})

db.defaults(
  {
    tree: {}, 
    nodes: {}
  }).write()

const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(morgan('dev'))

app.get('/tree', (req, res) => {
  res.send(db.get('tree').value())
})

app.post('/tree', (req, res) => {
  let serverNodesKeys = _.keys(db.get('nodes').value())
  let clientNodesKeys =  req.body.nodesKeys
  let shouldAddNodesKeys = _.difference(clientNodesKeys, serverNodesKeys)
  let shouldDeleteNodesKeys = _.difference(serverNodesKeys, clientNodesKeys)

  _.forEach(shouldDeleteNodesKeys, (key) => {
    db.get('nodes').unset(key).write()
  })
  _.forEach(shouldAddNodesKeys, (key) => {
    db.get('nodes').set(key, {}).write()
  })
  db.unset('tree').write()
  db.set('tree', req.body.data).write()
  res.sendStatus(200)
})

app.get('/node', (req, res) => {
  res.send(db.get('nodes').value())
})

app.get('/node/:nodeId/homework', (req, res) => {
  let path = _.join(['nodes', req.params.nodeId, 'homework'], '.')
  if (db.has(path).value()) {
    res.send(db.get(path).value())
  } else {
    res.sendStatus(404)
  }
})

app.post('/node/:nodeId/homework', (req, res) => {
  let path = _.join(['nodes', req.params.nodeId], '.')
  if (db.has(path).value()) {
    if (db.get(path).has('homework').value()) {
      db.get(path).unset('homework').write()
    }
    db.get(path).set('homework', req.body).write()
    res.sendStatus(200)
  } else {
    res.sendStatus(403)
  }
})

app.get('/node/:nodeId/material', (req, res) => {
  let path = _.join(['nodes', req.params.nodeId, 'material'], '.')
  if (db.has(path).value()) {
    res.send(db.get(path).value())
  } else {
    res.sendStatus(404)
  }
})

app.post('/node/:nodeId/material', upload.single('file'), (req, res) => {
  let path = _.join(['nodes', req.params.nodeId], '.')
  if (db.has(path).value()) {
    if (!db.get(path).has('material').value()) {
      db.get(path).set('material', []).write()
    }
    db.get(path).get('material').push(req.file.filename).write()
    res.sendStatus(200)
  } else {
    res.sendStatus(403)
  }  
})

app.put('/node/:nodeId/material', (req, res) => {
  let path = _.join(['nodes', req.params.nodeId, 'material'], '.')
  if (db.has(path).value()) {
    db.get(path).assign(req.body.material).write()
    res.sendStatus(200)
  } else {
    res.sendStatus(404)
  }
})

app.get('/node/:nodeId/material/:materialName', (req, res) => {
  let path = _.join(['nodes', req.params.nodeId, 'material'], '.')
  if (db.has(path).value()) {
    if (_.findIndex(db.get(path).value(), (o) => {return o === req.params.materialName}) !== -1) {
      res.sendFile(_.join(['material', req.params.materialName], '/'),  { root: __dirname})      
    } else {
      res.sendStatus(404)
    }
  } else {
    res.sendStatus(404)
  }
})

app.delete('/node/:nodeId/material/:materialName', (req, res) => {
  let path = _.join(['nodes', req.params.nodeId, 'material'], '.')
  if (db.has(path).value()) {
    let materialIndex = _.findIndex(db.get(path).value(), (o) => {return o === req.params.materialName})
    if (materialIndex !== -1) {
      fs.unlinkAsync(_.join(['material', req.params.materialName], '/')).then(() => {
        db.get(path).remove((materialName) => {return materialName === req.params.materialName}).write()
        res.sendStatus(204)
      }).catch((error) => {
        res.sendStatus(403)
      })
    } else {
      res.sendStatus(403)
    }
  } else {
    res.sendStatus(403)
  }  
})



app.listen(1234, function () {
  console.log('app listen on port 1234!')
})
