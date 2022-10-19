const express = require("express");
const passport = require("passport");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const { isLoggedIn, isNotLoggedIn } = require("./middlewares");

const router = express.Router();

// 회원가입
router.post("/join", isNotLoggedIn, async (req, res, next) => {
  const { email, nick, password } = req.body; // 구조분해
  try {
    const exUser = await User.findOne({ where: { email } });
    if (exUser) {
      return res.redirect("./join?error=exist");
    }
    // 뒤에 숫자가 길수록 암호화복잡도 올라감. 하지만 성능은 떨어짐.
    // password를 가져와서 비크립트로 암호화.
    const hash = await bcrypt.hash(password, 12);
    await User.create({
      email,
      nick,
      password: hash,
    });
    res.redirect("/"); // 회원가입후 다시 메인페이지로 돌려보낸다.
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.post("/login", isNotLoggedIn, (req, res, next) => {
  //아이디 비밀번호를 가져와서 구현할수 있지만 그럼 코드가 너무 복잡해진다.
  //그러므로 passport 라이브러리를 사용하면 코드가 깔끔해진다.
  //하지만 조금 이해를 필요로 한다.

  // authenticate 이거는 미들웨어다.
  // 1. passport.authenticate("local" 여기까지 일단 실행이됌.
  // 패스포트가 로컬스트레티지를 찾는다
  passport.authenticate("local", (authError, user, info) => {
    // done 함수를 호출하게 되면 이제 (authError, user, info) => 여기로 온다 (콜백함수)
    // authError 서버쪽에러, user 로그인 객체가 있는지없는지, info 로그인 실패시 메시지
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      return res.redirect(`/?loginError=${info.message}`);
    }
    // 로그인이 성공한경우 req.login을 쓴다
    // req.login 안에 사용자 객체를 넣어줍니다
    // req.login을 하는순간 passport index.js 로 간다.
    return req.login(user, (loginError) => {
      if (loginError) {
        console.error(loginError);
        return next(loginError); // 에러가 있었으면~ 이쪽.
      }
      // 세션쿠키가 브라우저로 보내준다. 브라우져가 세션정보를 들고있는것. 로그인된 상태가 되는것
      return res.redirect("/"); // 에러 없으면 성공 !
    });
  })(req, res, next); // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙입니다.
  // 미들웨어 확장패턴임.
});

router.get("/logout", (req, res) => {
  req.logout();
  req.session.destroy();
  res.redirect("/");
});

// 이걸 하는순간 카카오 홈페이지로가서 로그인을 하게된다.
router.get("/kakao", passport.authenticate("kakao"));

// 로그인을 성공하면 카카오가 밑에 유알엘로 요청하나 쏴준다.
router.get(
  "/kakao/callback",
  passport.authenticate("kakao", {
    failureRedirect: "/",
  }),
  (req, res) => {
    res.redirect("/");
  }
);

module.exports = router;
