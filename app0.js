const path = require("path")
const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const port = 3001
//var db = new sqlite3.Database("./bbs.sqlite3")

app.set("views","./templates")
app.locals.pretty = true

const users = [{
    id:1,
    name:"zs",
    password:123456,
},{
    id:2,
    name:"ls",
    password:123456,
},{
    id:3,
    name:"ww",
    password:123456,
}]
const posts = [{
    id:1,
    userId:2,
    title:"hello",
    content:"hello hello",
    timestamp:Date.now()
},{
    id:2,
    userId:3,
    title:"world",
    content:"world world",
    timestamp:Date.now()-10000
},{
    id:3,
    userId:1,
    title:"foo",
    content:"foo foo",
    timestamp:Date.now()-20000
}]
const comments = [{
    id:1,
    postId:2,
    userId:1,
    content:"klklklkl",
    timestamp:Date.now()-66666
},{
    id:2,
    postId:2,
    userId:3,
    content:"klklklkl",
    timestamp:Date.now()-66666
},{
    id:3,
    postId:2,
    userId:2,
    content:"klklklkl",
    timestamp:Date.now()-66666
}]

app.use((req, res, next) => {
    console.log(req.method,req.url)
    next() 
})
app.use(bodyParser.urlencoded())
// http://localhost/static/1.css
app.use("/static",express.static("./static"))
app.get("/",(req, res, next) => {
    res.render("index.pug",{posts})
})

app.route("/register")
    .get((req, res, next) => {
        res.sendfile(path.join(__dirname,"./static/register.html"))
    })
    .post((req, res, next) => {
        if (users.find(it=>it.name==req.body.username)){
            res.end("user has existed")
        } else {
            users.push({
                            id:users.length,
                            name:req.body.username,
                            password:req.body.password
                        })
            res.redirect("/login")
        }
    })

app.route("/login")
    .get((req, res, next) => {
        res.render("login.pug")
    })
    .post((req, res, next) => {
        
    })

app.get("/user/:userId",(req, res, next) => {
    var user = users.find(it=>it.id==req.params.userId)
    var userPosts = posts.filter(it=>it.userId==req.params.userId)
    res.render("user.pug",{
        user,
        posts:userPosts
    })
})

app.get("/post/:postId",(req, res, next) => {
    var post = posts.find(it=>it.id==req.params.postId)
    var comment = comments.filter(it=>it.postId == req.params.postId)
    if (post){
        res.render("post.pug",{post,comment})
    } else {  
        res.end("404")
    }
})

app.post("/addComment",(req, res, next)=>{
    console.log(req.body)
    res.redirect("/post/" + req.body.postId)
})

app.listen(port,()=>{
    console.log("server listening on port",port)
})