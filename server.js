const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const methodOverride = require("method-override"); //put
const MongoClient = require("mongodb").MongoClient;

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');


//app.use 미들웨어 웹서버는 요청 - 응담 사이 뭔가 실행되는 코드 

app.use(session({secret : 'Code', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session()); 

app.set("view engine", "ejs");
app.set("views", "./views");
app.use(bodyParser.urlencoded({ extended: true })); // 요청데이터 body 해석을 도와준다.
app.use("/public", express.static("public")); //미들웨어
app.use(methodOverride("_method"));

let db;
MongoClient.connect(
  "mongodb+srv://junseokoo:dlfjstlqk12@cluster0.sngbd0x.mongodb.net/?retryWrites=true&w=majority",
  function (error, client) {
    if (error) return console.log(error);

    db = client.db("todoapp");

    // db.collection("post").insertOne(
    //   { 이름: "John", 나이: 20 },
    //   function (error, result) {
    //     console.log("저장완료");
    //   }
    // );

    app.listen(8080, function () {
      console.log("listening on 8080");
    });
  }
);

app.get("/pet", function (req, res) {
  res.send("펫 용품 쇼핑할 수 있는 페이지입니다.");
});

app.get("/beauty", (req, res) => {
  res.send("뷰티용품 쇼핑할 수 있는 페이지입니다.");
});

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/write", (req, res) => {
  res.render("write.ejs");
});

app.post("/add", (req, res) => {
  res.send("작성완료");
  // console.log(req.body.date);
  // console.log(req.body.title);
  db.collection("counter").findOne({ name: "postNo" }, (err, result) => {
    console.log(result.totalPost);
    let postNo = result.totalPost;

    db.collection("post").insertOne(
      { _id: postNo + 1, 제목: req.body.title, 날짜: req.body.date },
      function (err, result) {
        console.log("저장완료");
        // counter 라는 콜렉션에 있는 totalPost 라는 항목도 1을 증가시켜야 한다.

        // res.redirect("/list");
      }
    );
    db.collection("counter").updateOne(
      { name: "postNo" },
      { $inc: { totalPost: 1 } },
      (err, result) => {
        // 어떤 데이터를 수정할지, 수정 값
        if (err) {
          return console.log(err);
        } else {
          return console.log(result);
        }
      }
    );
  });
});

// post list page
app.get("/list", (req, res) => {
  db.collection("post")
    .find()
    .toArray(function (err, result) {
      console.log(result);
      res.render("list.ejs", { posts: result });
    });
});

// 게시물 삭제
app.delete("/delete", (req, res) => {
  console.log(req.body);
  req.body._id = parseInt(req.body._id);
  db.collection("post").deleteOne(req.body, (result) => {
    console.log("삭제완료");
    res.status(200).send({ message: "성공이요" });
  });
});

// details page
app.get("/detail/:id", (req, res) => {
  // : ->  뒤에 파라미터 넣어줘
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    (err, result) => {
      console.log(result);
      res.render("detail.ejs", { data: result });
    }
  );
});

//edit page
app.get("/edit/:id", (req, res) => {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    (err, result) => {
      console.log(result);
      res.render("edit.ejs", { post: result });
    }
  );
});

// edit
app.put("/edit", (req, res) => {
  db.collection("post").updateOne(
    { _id: parseInt(req.body.id) },
    { $set: { 제목: req.body.title, 날짜: req.body.date } },
    (err, result) => {
      console.log("수정완료", result);

      res.redirect("/list");
    }
  );
});

// Login Page
app.get('/login', (req, res) => {
  res.render('login.ejs')
})

app.post('/login',passport.authenticate('local', {
  failureRedirect : '/fail'
}), (req, res) => {
  res.redirect('/')
})

// Login fail
app.get('/fail', (req, res) => {
  res.send("<script>alert('try login again.');</script>")
  res.redirect('/login')
})

// login check
passport.use(new LocalStrategy({
  usernameField: 'id',
  passwordField: 'pw',
  session: true,
  passReqToCallback: false,
}, function (inputId, inputPw, done) {
  console.log(inputId, inputPw);
  db.collection('login').findOne({ id: inputId }, function (err, result) {
    if (err) return done(err)

    if (!result) return done(null, false, { message: 'id is not exist.' })
    if (inputPw == result.pw) {
      return done(null, result)
    } else {
      return done(null, false, { message: 'pw is not correct.' })
    }
  })
}));

  // id,pw 검증 성공시 세션 데이터를 만들고 세션의 id 정보를 쿠키로 보낸다.
  passport.serializeUser(function (user, done) {
    done(null, user.id)
  });
  
  passport.deserializeUser(function (id, done) {
    done(null, {})
  }); 