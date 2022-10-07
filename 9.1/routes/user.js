const express = require("express");
const { isLoggedIn } = require("./middlewares"); // 이건 거의 필수로 만들어두는게
const User = require("../models/user");

const router = express.Router();

// /user/ ~~~ 로 시작
// POST /user/1/follow
router.post("/:id/follow", isLoggedIn, async (req, res, next) => {
  try {
    // 나에대한 객체를 찾는다
    const user = await User.findOne({ where: { id: req.user.id } });
    // 내가 있으면
    if (user) {
      // 수정할때 setFollowings
      // 수정할때 주의해야할점은 기존에 있던 팔로윙즈들을 제거하고 새로운걸 추가하는 것임
      // 복수로 쓰는거면 [] 배열로 넣어줘도 됌
      await user.addFollowing([parseInt(req.params.id, 10)]);
      res.send("success");
    } else {
      res.status(404).send("no user");
    }
  } catch (error) {
    console.error(error);
    next(error); // 에러 미들웨어로 보내줌
  }
});

module.exports = router;
