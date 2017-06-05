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
    callback(null, _.join([req.params.treeId, req.params.nodeId, file.originalname.replace(/\s+/g, '_').toLowerCase()], '_'))
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

const reversedPath = (...args) => (
  _.join(args, '.')
)

app.get('/tree/:treeId', (req, res) => {
  if (db.has(reversedPath('tree', req.params.treeId)).value()) {
    res.send(db.get(reversedPath('tree', req.params.treeId)).value())
  } else {
    res.sendStatus(404)
  }
})


app.post('/tree', (req, res) => {
  let treeId = req.body.treeId
  if (!db.has(reversedPath('nodes', treeId)).value()) {
    db.set(reversedPath('nodes', treeId), {}).write()
  }

  let serverNodesKeys = _.keys(db.get(reversedPath('nodes', treeId)).value())
  let clientNodesKeys = req.body.nodesKeys
  let shouldAddNodesKeys = _.difference(clientNodesKeys, serverNodesKeys)
  let shouldDeleteNodesKeys = _.difference(serverNodesKeys, clientNodesKeys)

  _.forEach(shouldDeleteNodesKeys, (key) => {
    db.get(reversedPath('nodes', treeId)).unset(key).write()
  })
  _.forEach(shouldAddNodesKeys, (key) => {
    db.get(reversedPath('nodes', treeId)).set(key, {}).write()
  })
  db.unset(reversedPath('tree', treeId)).write()
  db.set(reversedPath('tree', treeId), req.body.data).write()
  res.sendStatus(200)
})

// app.post('/tree', (req, res) => {
//   let serverNodesKeys = _.keys(db.get('nodes').value())
//   let clientNodesKeys = req.body.nodesKeys
//   let shouldAddNodesKeys = _.difference(clientNodesKeys, serverNodesKeys)
//   let shouldDeleteNodesKeys = _.difference(serverNodesKeys, clientNodesKeys)
//
//   _.forEach(shouldDeleteNodesKeys, (key) => {
//     db.get('nodes').unset(key).write()
//   })
//   _.forEach(shouldAddNodesKeys, (key) => {
//     db.get('nodes').set(key, {}).write()
//   })
//   db.unset('tree').write()
//   db.set('tree', req.body.data).write()
//   res.sendStatus(200)
// })

app.get('/tree/:treeId/node/', (req, res) => {
  res.send(db.get(reversedPath('nodes', req.params.treeId)).value())
})

app.get('/tree/:treeId/node/:nodeId/homework', (req, res) => {
  let path = _.join(['nodes', req.params.treeId, req.params.nodeId, 'homework'], '.')
  if (db.has(path).value()) {
    res.send(db.get(path).value())
  } else {
    res.sendStatus(404)
  }
})

app.post('/tree/:treeId/node/:nodeId/homework', (req, res) => {
  let path = _.join(['nodes', req.params.treeId, req.params.nodeId], '.')
  if (db.has(path).value()) {
    if (db.get(path).has('homework').value()) {
      db.get(path).unset('homework').write()
    }
    if (db.get(path).has('answer').value()) {
      db.get(path).unset('answer').write()
    }
    db.get(path).set('homework', req.body).write()
    db.get(path).set('answer', {}).write()
    res.sendStatus(200)
  } else {
    res.sendStatus(403)
  }
})

/* student part. needs refactor */
app.post('/tree/:treeId/node/:nodeId/answer/:studentId', (req, res) => {
  let path = _.join(['nodes', req.params.treeId, req.params.nodeId, 'answer'], '.')
  if (db.has(path).value()) {
    if (db.get(path).has(req.params.studentId).value()) {
      db.get(path).unset(req.params.studentId).write()
    }
    db.get(path).set(req.params.studentId, req.body.answer).write()
    res.sendStatus(200)
  } else {
    res.sendStatus(403)
  }
})

app.get('/tree/:treeId/node/:nodeId/answer/:studentId/status', (req, res) => {
  let path = _.join(['nodes', req.params.treeId, req.params.nodeId, 'answer'], '.')
  if (db.has(path).value()) {
    if (db.get(path).has(req.params.studentId).value()) {
      res.send({status: true})
    } else {
      res.send({status: false})
    }
  } else {
    res.sendStatus({status: false})
  }
})

app.get('/tree/:treeId/stat', (req, res) => {
  let result = {}
  _.forEach(db.get(reversedPath('nodes', req.params.treeId)).value(), (node, nodeId) => {
    if (_.has(node, 'homework.questions')) {
      let totalAccuracys = []

      _.forEach(_.get(node, 'homework.questions'), (question, questionIndex) => {
        if (question.choice) {
          if (_.has(node, 'answer')) {
            let answers = _.get(node, 'answer')
            let correct = 0
            let peopleCount = _.size(_.get(node, 'answer'))
            let accuracy = 0
            _.forEach(answers, (answer, studentId) => {
              if (answer[questionIndex] === question.answer) {
                // console.log({studentId: studentId, questionIndex: questionIndex, answer: question.answer})
                correct += 1
                // console.log({previous: correct - 1, current: correct})
              }
            })

            accuracy = {correct: correct, total: peopleCount}
            totalAccuracys.push(accuracy)
          }
        }
      })
      // let totalAccuracyForCurrentNode = _.sum(totalAccuracys) / totalAccuracys.length
      result[nodeId] = _.cloneDeep(totalAccuracys)
    }
  })
  res.send(result)
})

app.get('/tree/:treeId/node/:nodeId/material', (req, res) => {
  let path = _.join(['nodes', req.params.treeId, req.params.nodeId, 'material'], '.')
  if (db.has(path).value()) {
    res.send(db.get(path).value())
  } else {
    res.sendStatus(404)
  }
})

app.post('/tree/:treeId/node/:nodeId/material', upload.single('file'), (req, res) => {
  let path = _.join(['nodes', req.params.treeId, req.params.nodeId], '.')
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

app.put('/tree/:treeId/node/:nodeId/material', (req, res) => {
  let path = _.join(['nodes', req.params.treeId, req.params.nodeId, 'material'], '.')
  if (db.has(path).value()) {
    db.get(path).assign(req.body.material).write()
    res.sendStatus(200)
  } else {
    res.sendStatus(404)
  }
})

app.get('/tree/:treeId/node/:nodeId/material/:materialName', (req, res) => {
  let path = _.join(['nodes', req.params.treeId, req.params.nodeId, 'material'], '.')
  if (db.has(path).value()) {
    if (_.findIndex(db.get(path).value(), (o) => { return o === req.params.materialName }) !== -1) {
      res.sendFile(_.join(['material', req.params.materialName], '/'), { root: __dirname})
    } else {
      res.sendStatus(404)
    }
  } else {
    res.sendStatus(404)
  }
})

app.delete('/tree/:treeId/node/:nodeId/material/:materialName', (req, res) => {
  let path = _.join(['nodes', req.params.treeId, req.params.nodeId, 'material'], '.')
  if (db.has(path).value()) {
    let materialIndex = _.findIndex(db.get(path).value(), (o) => { return o === req.params.materialName })
    if (materialIndex !== -1) {
      fs.unlinkAsync(_.join(['material', req.params.materialName], '/')).then(() => {
        db.get(path).remove((materialName) => { return materialName === req.params.materialName }).write()
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
