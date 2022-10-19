const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 객체 분해해서 넣어줌 require("../models") 안에있는
// require(폴더명)을 사용하면 해당 폴더 안에 있는 "index.js" 모듈만 로딩된다.
// index페이지를 찾아서 그안의 post 객체, hashtag객체를 찾아서 할당
const { Post, Hashtag } = require("../models");
const { isLoggedIn } = require("./middlewares");

const router = express.Router();

try {
  fs.readdirSync("uploads");
} catch (error) {
  console.error("uploads 폴더가 없어 uploads 폴더를 생성합니다.");
  fs.mkdirSync("uploads");
}

// 멀터자체는 미들웨어가 아니다..
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, "uploads/");
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// 왜 한번에 업로드 하지않고 이미지 업로드하고 게시글업로드 하느냐
// 이미지가 클 경우 이미지 먼저 업로드후, 게시글 업로드하면 속도가 훨씬 빨라보임.
router.post("/img", isLoggedIn, upload.single("img"), (req, res) => {
  // upload url을 response에 가져다줘서 게시글 등록할때 url까지 같이 등록
  res.json({ url: `/img/${req.file.filename}` });
  // res.json({}) 이런식으로 하면 {} 안의 객체가 보내진다.
  // url : "tt" 면 화면단의 name이 url인 태그에 값이 넣어진다.
});

const upload2 = multer();
router.post("/", isLoggedIn, upload2.none(), async (req, res, next) => {
  // async 함수 쓸때는 try catch로 묶어주기
  try {
    const post = await Post.create({
      content: req.body.content,
      img: req.body.url,
      UserId: req.user.id,
    });
    const hashtag = req.body.content.match(/#[^\s#]*/g);
    // [#노드, #익스프레스]
    // [노드, 익스프레스]
    // [findOrCreate(노드), findOrCreate(익스프레스)] - 중복저장되지 않게 해주는것.둘다 프로미스임.
    // [promise.all] - promise 전체 실행
    // [[해시태그, true], [해시태그, false]] - true면 create한것, false면 select한 것
    if (hashtag) {
      const result = await Promise.all(
        hashtag.map((tag) => {
          // findOrCreate는 해시태그를 찾아서 있으면 조회, 없으면 생성하는 처리이다.
          // findOrCreate를 쓰면 db가 트랜잭션을 쓴다.
          // 원래는 if문으로 분기처리해줘야 하는것을 한방에 처리할 수 있게 됨
          // upsert 도 마찬가지. 있으면 update, 없으면 insert 처리. 분기처리 x
          return Hashtag.findOrCreate({
            // 앞에 #을 떼주는 처리
            where: { title: tag.slice(1).toLowerCase() },
          });
        })
      );
      await post.addHashtags(result.map((r) => r[0]));
    }
    res.redirect("/");
  } catch (error) {
    console.log(error);
    next(error);
  }
});

module.exports = router;
