# README

working backend server in JavaScript with Express and Lowdb.

`npm install` && `node app.js`


```javascript
PORT: 1234

//资源相关

//文件
GET '/tree/:treeId/node/:nodeId/resource/file'
//获得所有资源文件列表
success: [{url, description}...]
fail: 404

POST '/tree/:treeId/node/:nodeId/resource/file'
//上传新资源文件
body: {description: 'd'}
success: 200
fail: 403

PUT '/tree/:treeId/node/:nodeId/resource/file'
//拖拽调整顺序
body: {resource_file: [ {url, description},  {}, ... ] }
success: 200
fail: 404

GET '/tree/:treeId/node/:nodeId/resource/file/:fileName'
success: file
fail: 404

DELETE '/tree/:treeId/node/:nodeId/resource/file/:fileName'
success: 204
fail: 403

//链接
GET '/tree/:treeId/node/:nodeId/resource/link'
success: [{url, description}, {}...]
fail: 404

POST '/tree/:treeId/node/:nodeId/resource/link'
body: { resource_link: {url, description} }
success: 200
fail: 403

PUT '/tree/:treeId/node/:nodeId/resource/link'
body: { resource_link: [ {url, description} ... ] }
success: 200
fail: 404

POST '/tree/:treeId/node/:nodeId/resource/link/delete'
body: { resource_link: {url, description} }
success: 204
fail: 403


//选课相关

POST '/course/:courseId/select'
body: {username: 's1'}
success: 200
fail: 401
//已经选了 or 是老师 or 课程不存在 or username 不存在 均不能选课

GET '/course'
//所有课程的所有信息
success: [{"courseName":"course1","stakeholders":["a"],"trees":["t1"],"courseId":"c1"}]
fail: //it should not fail

GET '/user/:username/selectable_courses'
//该学生能选课课程信息，信息不包括参与者(stakeholder)
success: [{"courseName":"course1","trees":["t1"],"courseId":"c1"}]
fail: //it should not fail

------------------------------


POST '/register'
//type should be 'teacher' or 'student'
body: {username: 'z1', password: '123', type: 'teacher'}
success: 200
fail: 409

POST '/login'
body: {username: 'z1', password: '123', type: 'student'}
success: 200
fail: 401/404

POST '/user/:username/course'
//老师新建课程
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
