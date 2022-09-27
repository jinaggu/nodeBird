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
  passport.authenticate("local", (authError, user, info) => {
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      return res.redirect(`/?loginError=${info.message}`);
    }
    return req.login(user, isLoggedIn, (loginError) => {
      if (loginError) {
        console.error(loginError);
        return next(loginError); // 에러가 있었으면~ 이쪽.
      }
      return res.redirect("/"); // 에러 없으면 성공 !
    });
  })(req, res, next); // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙입니다.
});

router.get("/logout", (req, res) => {
  req.logout();
  req.session.destroy();
  res.redirect("/");
});

router.get("/kakao", passport.authenticate("kakao"));

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
