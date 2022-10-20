// 미들웨어 두개를 직접만들줄거다. 미들웨어는 req.res.next 세개가 들어있는것!!!
const jwt = require("jsonwebtoken");
const RateLimit = require("express-rate-limit");

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(403).send("로그인 필요");
  }
};

exports.isNotLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    next();
  } else {
    const message = encodeURIComponent("로그인한 상태입니다.");
    res.redirect(`/?error=${message}`);
  }
};

exports.verifyToken = (req, res, next) => {
  try {
    req.decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      // 유효기간 초과
      return res.status(419).json({
        code: 419,
        message: "토큰이 만료되었습니다.",
      });
    }
    return res.status(401).json({
      code: 401,
      message: "유효하지 않은 토큰입니다.",
    });
  }
};

exports.apiLimiter = new RateLimit({
  windowMs: 60 * 1000, // 1분
  max: 10, // 1분동안 1번보낼수 있다.
  delayMs: 0, // 1초, 호출간격 호출간격은 적어도 1초간격으로 해라.
  handler(req, res) {
    // 만약 제한을 어겼을 경우.
    res.status(this.statusCode).json({
      code: this.statusCode, // 기본값 429 - 할당량을 넘었다.
      message: "1분에 한 번만 요청할 수 있습니다.",
    });
  },
});

exports.deprecate = (req, res) => {
  res.status(410).json({
    code: 419,
    message: "새로운 버전이 나왔습니다. 새로운 버전을 사용하세요.",
  });
};
