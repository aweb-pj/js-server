# README

working backend server in JavaScript with Express and Lowdb.

`npm install` && `node app.js`


```javascript
PORT: 1234

//资源相关

//文件
GET '/tree/:treeId/node/:nodeId/resource/file'
//获得该结点所有资源文件列表
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
//获取资源文件
success: file
fail: 404

DELETE '/tree/:treeId/node/:nodeId/resource/file/:fileName'
//删除资源文件
success: 204
fail: 403

//链接
GET '/tree/:treeId/node/:nodeId/resource/link'
//获得该结点所有资源链接
success: [{url, description}, {}...]
fail: 404

POST '/tree/:treeId/node/:nodeId/resource/link'
//向某结点增加新的资源链接
body: { resource_link: {url, description} }
success: 200
fail: 403

PUT '/tree/:treeId/node/:nodeId/resource/link'
//更新某结点的资源链接（拖动调整顺序需要）
body: { resource_link: [ {url, description} ... ] }
success: 200
fail: 404

POST '/tree/:treeId/node/:nodeId/resource/link/delete'
//删除指定结点的指定资源链接
body: { resource_link: {url, description} }
success: 204
fail: 403


//选课相关

POST '/course/:courseId/select'
//选课
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
//注册
//type should be 'teacher' or 'student'
body: {username: 'z1', password: '123', type: 'teacher'}
success: 200
fail: 409

POST '/login'
//登录
body: {username: 'z1', password: '123', type: 'student'}
success: 200
fail: 401/404

POST '/user/:username/course'
//老师新建课程
body: {courseId; 'c1', courseName: 'course'}
success: 200
fail: 200

GET '/user/:username/course'
//拿到用户参与的所有课程
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
//向某课程增加或更新思维导图
body: {courseId: 'c1', ... 其他和原来的 post '/tree'一样}

GET  '/course/:courseId/tree'
//拿到某课程所有思维导图id
success: ['tree1', 'tree2' ...]
fail: 401

GET '/course/:courseId'
//拿到某课程全部信息
success: {
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
//得到某思维导图的完整数据
success: jsMind data
fail: 404

POST '/tree'
//新增思维导图
body: {treeId: 'testId', nodesKeys: {}, data: {} } //please refer to `async save_mindmap ()` in `front-end`
success: 200

GET '/tree/:treeId/node/'
//得到某思维导图的结点数据
success: {root: {} }


GET '/tree/:treeId/node/:nodeId/homework'
//得到某结点的作业
success: {questions: [{question: 'text', choice: true, A: 1, B: 2, C: 3, D: 4}, ...]}
fail: 404

POST '/tree/:treeId/node/:nodeId/homework'
//上传作业到某结点
success: 200
fail: 403

POST '/tree/:treeId/node/:nodeId/answer/:studentId'
//学生提交某结点作业答案
success: 200
fail: 403

GET '/tree/:treeId/node/:nodeId/answer/:studentId/status'
//得到学生某结点有无提交作业情况
success: {status: true/false}
fail: 404

GET '/tree/:treeId/stat'
//得到某思维导图各结点作业完成情况
success: {root: {correct: 3, total: 5} ...}
fail: {}

GET '/tree/:treeId/node/:nodeId/material'
//得到某结点课件名列表
success: ['filename1' ...]
fail: 404

POST '/tree/:treeId/node/:nodeId/material'
//上传课件到某结点
success: 200
fail: 403

PUT '/tree/:treeId/node/:nodeId/material'
//更新某结点课件列表（拖拽调整顺序需要）
success: 200
fail: 404

GET '/tree/:treeId/node/:nodeId/material/:materialName'
//得到某结点某课件文件
success: file
fail: 404

DELETE '/tree/:treeId/node/:nodeId/material/:materialName'
//删除某结点某课件
success: 204
fail: 403

```
