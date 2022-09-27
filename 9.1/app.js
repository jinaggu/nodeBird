const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");
const session = require("express-session");
const nunjucks = require("nunjucks");
const dotenv = require("dotenv");
const passport = require("passport");

// dotenv는 최대한 위로 !!
dotenv.config(); // 항상 닷엔브 파일은 제일 상단에 정의! db 설정파일이나 이런게 있을수 있기 때문에
const pageRouter = require("./routes/page");
const authRouter = require("./routes/auth");
const { sequelize } = require("./models");
const passportConfig = require("./passport");

const app = express();
app.set("port", process.env.PORT || 8001);
app.set("view engine", "html");
nunjucks.configure("views", {
  express: app,
  watch: true,
});
// 시퀄라이즈 연결. 시퀄라이즈는 프로미스다.
// 시퀄라이즈 테이블정보를 변경하면 디비쪽가서 수동으로 바꿔줘야한다.
// force: true 하면 시퀄라이즈 테이블 변경이 일어나면 테이블을 삭제하고 다시 재생성한다.
// 이건 실무에서는 절대 하면 안됌. 고객들정보나 실제쓰이는 정보가 다 날아간다. 조심또조심.
sequelize
  .sync({ force: false })
  .then(() => {
    console.log("데이터베이스 연결 성공");
  })
  .catch((err) => {
    console.error(err);
  });
passportConfig();

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
// 얘네둘은 익스프레스 세션아래에 있어야한다~!!!
app.use(passport.initialize());
app.use(passport.session()); // passport.session 이 실행될때 디시리얼라이즈유저가 실행이 된다.

app.use("/", pageRouter);
app.use("/auth", authRouter);

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
