# README

working backend server in JavaScript with Express and Lowdb.

`npm install` && `node app.js`


```javascript
PORT: 1234

GET '/tree/:treeId'
success: jsMind data
fail: 404

POST '/tree'
body: {treeId: 'testId', nodesKeys: {}, data: {} } //please refer to `async save_mindmap ()` in `front-end`
success: 200

GET '/tree/:treeId/node/'
success: {root: {} }


GET '/tree/:treeId/node/:nodeId/homework'
success: {questions: [{question: 'text', choice: true, A: 1, B: 2, C: 3, D: 4}, ...]}
fail: 404

POST '/tree/:treeId/node/:nodeId/homework'
success: 200
fail: 403

POST '/tree/:treeId/node/:nodeId/answer/:studentId'
success: 200
fail: 403

GET '/tree/:treeId/node/:nodeId/answer/:studentId/status'
success: {status: true/false}
fail: 404

GET '/tree/:treeId/stat'
success: {root: {correct: 3, total: 5} ...}
fail: {}

GET '/tree/:treeId/node/:nodeId/material'
success: ['filename1' ...]
fail: 404

POST '/tree/:treeId/node/:nodeId/material'
success: 200
fail: 403

PUT '/tree/:treeId/node/:nodeId/material'
success: 200
fail: 404

GET '/tree/:treeId/node/:nodeId/material/:materialName'
success: file
fail: 404

DELETE '/tree/:treeId/node/:nodeId/material/:materialName'
success: 204
fail: 403

```
