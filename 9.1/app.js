const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");
const session = require("express-session");
const nunjucks = require("nunjucks");
const dotenv = require("dotenv");

// dotenv는 최대한 위로 !!
dotenv.config(); // 항상 닷엔브 파일은 제일 상단에 정의! db 설정파일이나 이런게 있을수 있기 때문에
const pageRouter = require("./routes/page");

const app = express();
app.set("port", process.env.PORT || 8001);
app.set("view engine", "html");
nunjucks.configure("views", {
  express: app,
  watch: true,
});

app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET)); // 쿠키에 서명하는 것 !!
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
      httpOnly: true,
      secure: false,
    },
  })
);

app.use("/", pageRouter);

// 이 미들웨어까지 넘어온거면 라우터가 없는 것이기 때문에 404임.
// 404 에러를 처리해주기 위한 미들웨어를 만든것.
app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error); // 넥스트로 error를 넘겨주면 에러처리 미들웨어로 가게된다.
});
// 에러처리 미들웨어. 파라미터에 err, req, res, next가 있으면 에러처리 미들웨어이다.
// 마지막 next를 안쓰더라도 가지고 있어야 된다. 반드시~
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  // 개발할때만 스택트레이스볼수 있게.
  res.locals.error = process.env.NODE_ENV !== "production" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

app.listen(app.get("port"), () => {
  console.log(app.get("port"), "번 포트에서 대기중");
});
