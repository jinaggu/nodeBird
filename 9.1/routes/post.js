const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 객체 분해해서 넣어줌 require("../models") 안에있는
// require(폴더명)을 사용하면 해당 폴더 안에 있는 "index.js" 모듈만 로딩된다.
// index페이지를 찾아서 그안의 post 객체, hashtag객체를 찾아서 할당
const { Post, Hashtag } = require("../models");
const { isLoggIn, isLoggedIn } = require("./middlewares");

const router = express.Router();

try {
  fs.readdirSync("uploads");
} catch (error) {
  console.error("uploads 폴더가 없어 uploads 폴더를 생성합니다.");
  fs.mkdirSync("uploads");
}

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

router.post("/img", isLoggedIn, upload.single("img"), (req, res) => {
  console.log(req.file);
  res.json({ url: `/img/${req.file.filename}` });
});
