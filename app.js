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
    users: {},
    courses: {},
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

app.get('/db', (req, res) => {
  res.send(db.getState())
})

app.post('/register', (req, res) => {
  let username = req.body.username
  let password = req.body.password
  let type = req.body.type
  if (db.get('users').has(username).value()) {
    res.sendStatus(409)
  } else {
    db.get('users').set(username, {password: password, type: type}).write()
    res.sendStatus(200)
  }
})

app.post('/login', (req, res) => {
  let username = req.body.username
  let password = req.body.password
  let type = req.body.type
  let hasThisUser = db.get('users').has(username).value()
  if (!hasThisUser) {
    res.sendStatus(404)
    return
  }
  let userInDB = db.get('users').get(username).value()
  if (password === userInDB.password && type === userInDB.type) {
    res.sendStatus(200)
  } else {
    res.sendStatus(401)
  }
})

app.post('/user/:username/course', (req, res) => {
  let username = req.params.username
  let courseId = req.body.courseId
  let courseName = req.body.courseName

  if (!db.get('users').has(username).value()) {
    res.sendStatus(401)
    return
  }
  if (db.get('users').get(username).value().type !== 'teacher') {
    res.sendStatus(401)
    return
  }
  if (db.get('courses').has(courseId).value()) {
    res.sendStatus(401)
    return
  }
  db.get('courses').set(courseId, {courseName: courseName, stakeholders:[username], trees: []}).write()
  res.sendStatus(200)
})

app.post('/course/:courseId/select', (req, res) => {
  let username = req.body.username
  let courseId = req.params.courseId
  if (!db.get('users').has(username).value()) {
    res.sendStatus(401)
    return
  }
  if (db.get('users').get(username).value().type !== 'student') {
    res.sendStatus(401)
  }
  if (!db.get('courses').has(courseId).value()) {
    res.sendStatus(401)
    return
  }
  let stakeholdersOfCourse = db.get('courses').get(courseId).get('stakeholders')
  if (_.findIndex(stakeholdersOfCourse.value(), (stakeholder) => {
    return stakeholder === username
    }) === -1) {
    stakeholdersOfCourse.push(username).write()
    res.sendStatus(200)
    return
  } else {
    res.sendStatus(401)
    return
  }

})

app.get('/course', (req, res) => {
  let courseArray = []
  _.forEach(db.get('courses').value(), (course, key) => {
      let clonedCourse = _.cloneDeep(course)
      clonedCourse.courseId = key
      courseArray.push(clonedCourse)
  })
  res.send(courseArray)
})

app.get('/user/:username/selectable_courses', (req, res) => {
  let courses = db.get('courses').value()
  let courseArray = []
  _.forEach(courses, (course, key) => {
    if (_.findIndex(course.stakeholders, (stakeholder) => {
      return stakeholder === req.params.username
      }) === -1) {
      let clonedCourse = _.cloneDeep(course)
      try {
        delete clonedCourse.stakeholders
      } catch (e) {
      }
      clonedCourse.courseId = key
      courseArray.push(clonedCourse)
    }
  })
  res.send(courseArray)
})

app.get('/user/:username/course', (req, res) => {
  let username = req.params.username
  if (!db.get('users').has(username).value()) {
    res.sendStatus(401)
    return
  }
  let courses = db.get('courses').value()
  if (_.size(courses) === 0) {
    res.send([])
    return
  }
  let coursesOfUser = []
  _.forEach(courses, (course, courseId) => {
    if (_.findIndex(course.stakeholders, (holder) => {
        return holder === username
      } ) !== -1) {
      let clonedCourse = _.cloneDeep(course)
      clonedCourse.courseId = courseId
      coursesOfUser.push(clonedCourse)
    }
  })
  res.send(coursesOfUser)
})

app.post('/course/:courseId/tree', (req, res) => {
  let courseId = req.params.courseId
  if (!db.get('courses').has(courseId).value()) {
    res.sendStatus(401)
    return
  }
  if (_.isEmpty(req.body.treeId)) {
    res.sendStatus(400)
    return
  }
  let treesOfCourse = db.get('courses').get(courseId).get('trees').value()
  if (_.findIndex(treesOfCourse, (treeId) => {
    return treeId === req.body.treeId
    }) === -1) {
    db.get('courses').get(courseId).get('trees').push(req.body.treeId).write()
  }
    return treePostHandler(req, res)
})

app.get('/course/:courseId/tree', (req, res) => {

  if (!db.get('courses').has(req.params.courseId).value()) {
    res.send(401)
  return
  }
  res.send(db.get('courses').get(req.params.courseId).get('trees').value())
})

app.get('/course/:courseId', (req, res) => {
  if (!db.get('courses').has(req.params.courseId).value()) {
    res.send(401)
    return
  }
  res.send(db.get('courses').get(req.params.courseId).value())
})


app.get('/tree', (req, res) => {
  res.send(_.keys(db.get('tree').value()))
})

app.get('/tree/:treeId', (req, res) => {
  if (db.has(reversedPath('tree', req.params.treeId)).value()) {
    res.send(db.get(reversedPath('tree', req.params.treeId)).value())
  } else {
    res.sendStatus(404)
  }
})

function treePostHandler (req, res) {
  let treeId = req.body.treeId
  if (_.isEmpty(treeId)) {
    res.sendStatus(400)
    return
  }
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
}

app.post('/tree', treePostHandler)

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
    res.sendStatus(404)
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
            if (peopleCount !== 0) {
              accuracy = {correct: correct, total: peopleCount, rate: correct / peopleCount}
            } else {
              accuracy = {correct: correct, total: peopleCount, rate: 0}
            }
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

const resourceStorage = multer.diskStorage({
  destination: 'resource_file',
  filename: function (req, file, callback) {
    callback(null, _.join([req.params.treeId, req.params.nodeId, file.originalname.replace(/\s+/g, '_').toLowerCase()], '_'))
  }
})

const resourceUpload = multer({storage: resourceStorage})


/*****resource file********/

app.get('/tree/:treeId/node/:nodeId/resource/file', (req, res) => {
  let path = _.join(['nodes', req.params.treeId, req.params.nodeId, 'resource_file'], '.')
  if (db.has(path).value()) {
    res.send(db.get(path).value())
  } else {
    res.sendStatus(404)
  }
})

app.post('/tree/:treeId/node/:nodeId/resource/file', resourceUpload.single('file'), (req, res) => {
  let path = _.join(['nodes', req.params.treeId, req.params.nodeId], '.')
  if (db.has(path).value()) {
    if (!db.get(path).has('resource_file').value()) {
      db.get(path).set('resource_file', []).write()
    }
    db.get(path).get('resource_file').push({url: _.join(['https://aweb.jtwang.me', 'tree', req.params.treeId, 'node', req.params.nodeId, 'resource', 'file', req.file.filename], '/'), description: req.body.description}).write()
    res.sendStatus(200)
  } else {
    res.sendStatus(403)
  }
})

app.put('/tree/:treeId/node/:nodeId/resource/file', (req, res) => {
  let path = _.join(['nodes', req.params.treeId, req.params.nodeId, 'resource_file'], '.')
  if (db.has(path).value()) {
    db.get(path).assign(req.body.resource_file).write()
    res.sendStatus(200)
  } else {
    res.sendStatus(404)
  }
})

app.get('/tree/:treeId/node/:nodeId/resource/file/:fileName', (req, res) => {
  let path = _.join(['nodes', req.params.treeId, req.params.nodeId, 'resource_file'], '.')
  if (db.has(path).value()) {
    if (_.findIndex(db.get(path).value(), (o) => { return o.url === _.join(['https://aweb.jtwang.me', 'tree', req.params.treeId, 'node', req.params.nodeId, 'resource', 'file', req.params.fileName], '/') }) !== -1) {
      res.sendFile(_.join(['resource_file', req.params.fileName], '/'), { root: __dirname})
    } else {
      res.sendStatus(404)
    }
  } else {
    res.sendStatus(404)
  }
})

app.delete('/tree/:treeId/node/:nodeId/resource/file/:fileName', (req, res) => {
  let path = _.join(['nodes', req.params.treeId, req.params.nodeId, 'resource_file'], '.')
  if (db.has(path).value()) {
    let materialIndex = _.findIndex(db.get(path).value(), (o) => { return o.url === _.join(['https://aweb.jtwang.me', 'tree', req.params.treeId, 'node', req.params.nodeId, 'resource', 'file', req.params.fileName], '/') })
    if (materialIndex !== -1) {
      fs.unlinkAsync(_.join(['resource_file', req.params.fileName], '/')).then(() => {
        db.get(path).remove((file) => { return file.url === _.join(['https://aweb.jtwang.me', 'tree', req.params.treeId, 'node', req.params.nodeId, 'resource', 'file', req.params.fileName], '/') }).write()
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


/*****resource link********/

app.get('/tree/:treeId/node/:nodeId/resource/link', (req, res) => {
  let path = _.join(['nodes', req.params.treeId, req.params.nodeId, 'resource_link'], '.')
  if (db.has(path).value()) {
    res.send(db.get(path).value())
  } else {
    res.sendStatus(404)
  }
})

app.post('/tree/:treeId/node/:nodeId/resource/link', (req, res) => {
  let path = _.join(['nodes', req.params.treeId, req.params.nodeId], '.')
  if (db.has(path).value()) {
    if (!db.get(path).has('resource_link').value()) {
      db.get(path).set('resource_link', []).write()
    }
    db.get(path).get('resource_link').push(req.body.resource_link).write()
    res.sendStatus(200)
  } else {
    res.sendStatus(403)
  }
})

app.put('/tree/:treeId/node/:nodeId/resource/link', (req, res) => {
  let path = _.join(['nodes', req.params.treeId, req.params.nodeId, 'resource_link'], '.')
  if (db.has(path).value()) {
    db.get(path).assign(req.body.resource_link).write()
    res.sendStatus(200)
  } else {
    res.sendStatus(404)
  }
})


app.post('/tree/:treeId/node/:nodeId/resource/link/delete', (req, res) => {
  let path = _.join(['nodes', req.params.treeId, req.params.nodeId, 'resource_link'], '.')
  if (db.has(path).value()) {
    let materialIndex = _.findIndex(db.get(path).value(), (o) => { return _.isEqual(o, req.body.resource_link) })
    if (materialIndex !== -1) {
      db.get(path).remove((o) => { return _.isEqual(o, req.body.resource_link) }).write()
      res.sendStatus(204)
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
