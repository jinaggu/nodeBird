const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const morgan = require("morgan");
const session = require("express-session");
const nunjucks = require("nunjucks");
const dotenv = require("dotenv");
const cors = require("cors");

// dotenv는 제일 최상단에 올려놓는다. 설정프로퍼티들이 들어 있기 때문.
dotenv.config();
const authRouter = require("./routes/auth");
const indexRouter = require("./routes");
const v1 = require("./routes/v1");
const v2 = require("./routes/v2"); // 한번 버전을 내놓으면 수정을하면 안된다. 외부서비스가 고장날 수 있슴.
// 이렇게 버전을 올려서 수정해야함.
const { sequelize } = require("./models");
const passportConfig = require("./passport"); // require에 폴더명만 적을경우 index.js를 가지고 온다.

const app = express(); // express 객체 생성
passportConfig(); // passport 실행

app.set("port", process.env.PORT || 8002); // 포트 설정
app.set("view engine", "html");
nunjucks.configure("views", {
  express: app,
  watch: true,
});
sequelize
  .sync({ force: false })
  .then(() => {
    console.log("데이터 베이스 연결 성공.");
  })
  .catch((err) => {
    console.log(err);
  });

app.use(morgan("dev")); // morgan 미들웨어 dev용으로 사용.
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json()); // 이게 바디파서를 대신한다.
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
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

// 패스포트 관련 로직은 반드시 ! session 로직 선언한 곳 뒤! 에 존재해야 한다.!!
app.use(passport.initialize()); // 요청(request)이 들어오면 passport가 구동됨.
app.use(passport.session()); // 앱의 session과 passport의 session과 연결.
app.use(cors({ origin: true, Credentials: true }));

app.use("/auth", authRouter);
app.use("/", indexRouter);
app.use("/v1", v1);
app.use("/v2", v2);

// 여기까지 왔으면 404..! !!!
app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error); // 에러처리 미들웨어로 보낸다.
});

// 에러처리 미들웨어에는 가지 파라미터를 모두 가져야한다.
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== "production" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

app.listen(app.get("port"), () => {
  console.log(app.get("port"), "번 포트에서 대기중.");
});
