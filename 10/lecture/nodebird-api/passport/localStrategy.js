// 이메일로 로그인
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

const User = require("../models/user");

module.exports = () => {
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email", // req.body.email 이게 일치를 해야한다
        passwordField: "password", // req.body.password
      },
      async (email, password, done) => {
        try {
          // 일단 이메일을 찾는다.
          const exUser = await User.findOne({ where: { email } });
          // 이메일이 있는 사람이 있으면 (회원은 이메일이 등록되어 있으니까)
          if (exUser) {
            // 리턴값 true 거나 false 거나
            const result = await bcrypt.compare(password, exUser.password);
            if (result) {
              // done 함수에 대하여~
              // done 함수는 인자를 3가지를 받는다.
              // 첫번재 인자는 서버에러. done에 기본적으로 첫번째 에러는 null이 들어감
              // 로그인이 성공한 경우 로그인객체를 두번째에다가 넣어준다
              // done 함수를 호출하게되면 ? -> serializeUser에 exUser정보를 넘겨주는것...
              done(null, exUser);
            } else {
              // 로그인이 실패한경우라 두번째에 false를 넣어줌.
              // 세번째 인자는 로그인 실패했을때 메세지
              done(null, false, { message: "비밀번호가 일치하지 않습니다." });
            }
          } else {
            // 이메일이 없으면 가입안한사람임.
            // 로그인이 실패한경우라 두번째에 false를 넣어줌.
            // 세번째 인자는 로그인 실패했을때 메세지
            done(null, false, { message: "가입되지 않은 회원입니다." });
          }
        } catch (error) {
          console.log(error);
          done(error);
        }
      }
    )
  );
};
