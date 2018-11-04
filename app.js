const path = require("path")
const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")
const multer = require("multer")
const avatarUpload = multer({dest: path.join(__dirname, "/static/avatars")})
const sqlite = require("sqlite")

const port = 3001
var sessions = {}

var dbPromise = sqlite.open(path.join(__dirname,"./bbs.db"),{Promise})
var db

app.set("views",path.join(__dirname,"./templates"))
app.locals.pretty = true

app.use(bodyParser.urlencoded({ extended: true}))
app.use(cookieParser("fdsfsdfsdfgb"))
//app.use(bodyParser.json())
app.use("/static", express.static(path.join(__dirname, './static')))
app.use("/avatar", express.static(path.join(__dirname, './static/avatars')))

app.use(async(req, res, next) => {
  // try {
    req.user = await db.get("SELECT * FROM users WHERE users.id=?", req.signedCookies.userId)
    next()
  // } catch(e){
  //   next()
  // }
  console.log("req.user:", req.user)
})

app.use(async(req, res, next) => {
  if (!req.cookies.sessionId){
    res.cookie("sessionId", Math.random().toString(16).substr(2))
  }
  next()
})

app.use((req, res, next) => {
    console.log(req, res)
    next()
})

app.get("/", async(req, res, next) => {
  var posts = await db.all("SELECT * FROM posts")
  console.log("posts:" + posts)
  res.render("index.pug",{posts, user: req.user})
})

app.get("/user/:userId", async(req, res, next) => {
  var user = await db.get("SELECT * FROM users WHERE id=?",req.params.userId)
  if(user){
    var userPosts = await db.all("SELECT * FROM posts WHERE userId=?",req.params.userId)
    var userComments = await db.all("SELECT comments.*,title FROM comments JOIN posts ON comments.postId=posts.id WHERE comments.userId=?", req.params.userId)
    res.render("user.pug", {
      user,
      posts: userPosts,
      comments: userComments
    })
  } else {
    res.render('user.pug', {user: null})
  }
})

app.get("/post/:postId", async(req, res, next) => {
  var post = await db.get("SELECT * FROM posts WHERE posts.id=?",req.params.postId)
  if (post){
    var comments = await db.all(`SELECT comments.*,name,avatar 
        FROM comments JOIN users
        ON comments.userId=users.id
        WHERE comments.postId=?`,req.params.postId)
    //这里为何跳转到了一个新的页面??
    res.render("post.pug", {
      post,
      comments,
      user: req.user
    })
  } else {
    res.end("帖子不存在")
  }
})


app.route("/add-post")
  .get((req, res, next) => {
    res.render("add-post.pug",{user: req.user})
  })
  .post(async (req, res, next) => {
    if(req.signedCookies.userId){
      await db.run("INSERT INTO posts (userId,title,content,timestamp) VALUES (?,?,?,?)", req.signedCookies.userId, 
        req.body.title, req.body.content, Date.now())
      var newPost = await db.get("SELECT * FROM posts ORDER BY timestamp DESC LIMIT 1")
      res.redirect("/post/" + newPost.id)
    } else {
      res.end("您未登录不能发帖")
    }
  })

app.get("/delete-post/:postId", async (req, res, next) => {
  var post = await db.get("SELECT * FROM posts WHERE id=?", req.params.postId)
  if (post && req.user){
    if (post.userId == req.user.id){
      await db.run("DELETE FROM posts WHERE id=?", req.params.postId)
    }
    res.redirect(req.headers.referer)
  } else {
    res.end("不能删除")
  }
})

app.post("/add-comment", async (req, res, next) => {
  console.log("headers:" + req.headers, "req.body" + req.body)
  console.log(req.signedCookies)
  if (req.signedCookies.userId){
    await db.run("INSERT INTO comments (postId, userId, content, timestamp) VALUES (?,?,?,?)", 
      req.body.postId, req.signedCookies.userId, req.body.content, Date.now())
    var comment = await db.get("SELECT * FROM comments JOIN users ON comments.userId=users.id ORDER BY timestamp DESC LIMIT 1")
    //??res.json(comment)
    res.redirect("post/" + req.body.postId)
  } else {
    res.end("未登录不能发表评论")
  }
})
  

app.route("/register")
  .get((req, res, next) => {
    res.render("register.pug")
    //??res.sendFile(path.join(__dirname, "./static/register.html"))
  })
  .post(avatarUpload.single("avatar"), async(req, res, next) => {
    var user = await db.get("SELECT * FROM users WHERE name=?", req.body.username)
    console.log("register:", req.file, req.body)
    if (user){
      res.end("用户已注册")
    } else {
      await db.run("INSERT INTO users (name, password, avatars) VALUES (?,?,?)",req.body.username, req.body.password, req.file.filename)
      res.redirect("/login")
    }
  })

app.get("/captcha", (req, res, next) => {
  var captcha = Math.random().toString(16).substr(2,4)
  sessions[req.cookies.sessionId] = captcha
  res.setHeader("Content-Type", "image/svg+xml")
  res.end(`
    <svg width="100" height="20" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="20">${captcha}</text>
    </svg>
  `)
})

app.route("/login")
  .get((req, res, next) => {
    res.render("login.pug")
  })
  .post(async (req, res,next) => {
    if(req.body.captcha != sessions[req.cookies.sessionId]){
      res.end("验证码不正确")
      return 
    }
    var user = await db.get("SELECT * FROM users WHERE name=? and password=?",req.body.username, req.body.password)
    console.log("user:" + user)
    if(user){
      res.cookie("userId", user.id, {
        signed: true
      })
      res.redirect("/")
    } else {
      res.end("用户不存在或密码不正确")
    }
  })

app.get("/logout", (req, res, next) => {
  res.clearCookie("userId")
  res.redirect("/")
})

;(async function () {
  db = await dbPromise;
  app.listen(port, () => {
    console.log('server listening on port', port)
  })
}())