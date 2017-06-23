# README

working backend server in JavaScript with Express and Lowdb.

`npm install` && `node app.js`


```javascript
PORT: 1234

POST '/register'
//type should be 'teacher' or 'student'
body: {username: 'z1', password: '123', type: 'teacher'}
success: 200
fail: 409

POST '/login'
body: {username: 'z1', password: '123'}
success: 200
fail: 401/404

POST '/user/:username/course'
body: {courseId; 'c1', courseName: 'course'}
success: 200
fail: 200

GET '/user/:username/course'
//stakeholers: 所有参与者，包括自己
success: [
    {
        "courseName": "C1",
        "stakeholders": [
            "tu1"
        ],
        "trees": [],
        "courseId": "c1"
    }，
    ...
]
fail: 401

POST '/course/:courseId/tree'
body: {courseId: 'c1', ... 其他和原来的 post '/tree'一样}

GET  '/course/:courseId/tree'
success: ['tree1', 'tree2' ...]
fail: 401

GET '/course/:courseId'
success:     {
        "courseName": "C1",
        "stakeholders": [
            "tu1"
        ],
        "trees": [],
        "courseId": "c1"
    }
fail: 401

------------------------------

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
