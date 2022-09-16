const passport = require("passport");
const local = require("./localStrategy");
const kakao = require("./kakaoStrategy");
const User = require("../models/user");

// passport는 전략이라는것을 사용한다 !!
// 로그인을 어떻게할지 적어놓은 파일이다. 그걸 전략이라고 부름.
module.exports = () => {
  // req.login(user)... 하는순간 이제 여기로 오는것
  passport.serializeUser((user, done) => {
    // 로그인성공 객체인 user에서 user.id만 뽑아서 done 함수로 보낸다.
    // session에 user의 id만 저장한다는 소리임.
    // 여기에 user 통째로 넣어줘도 된다.
    // 나중엔 디비에 정보가 너무 많아질것. 그래서 아이디만 있어도 그사람의 정보를 다시 불러올수있기 때문에
    // 아이디만 저장을 해놓는다.
    // 실무에서는 메모리에서도 저장하면 안된다. ex) 페이스북은 동시접속자가 1억명 ~ 이상인데 이걸 어떻게 버팀 ?
    // 그래서 그럴땐 메모리 저장용 디비를 따로쓴다.
    done(null, user.id);
    // 다시 여기서 done 되는순간 req.login( 안의 콜백함수로 들어간다. ) (약간 왔다갔다하기 때문에 헷깔릴수 있음.)
  });

  // app.js 안에서 passport.session() 이 실행되면 이 디시리얼라이즈유저로 옴.
  // 그리고 session에 저장되어있는 user.id를 찾아서 id로 넘겨줌.
  passport.deserializeUser((id, done) => {
    User.findOne({ where: { id } }) // 디비에서 찾는다.
      .then((user) => done(null, user)) // 있으면 user 객체를 복구시켜줌. req.user로 접근가능하다.
      .catch((err) => done(err)); // req.isAuthenticated() 를 실행하면 여기서는 true가 나온다.
  }); // 이게 바로 패스포트 세션임.

  local(); // local 이라고 등록을 해논것임.
  kakao();
};
