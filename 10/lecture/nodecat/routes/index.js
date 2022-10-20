// 이거는 노드캣 서비스임. 잘기억해두자 ~ 어떻게 흘러가는지~
const express = require("express");
const axios = require("axios");

const router = express.Router();
const URL = "http://localhost:8002/v2";

axios.defaults.headers.origin = "http://localhost:4000"; // origin 헤더 추가

// 토큰 검증을 하면서, 통신까지 하기 때문에
// 모든 라우터에서 쓰인다, 공통으로 쓰이기 때문에 함수로 빼서 중복방지.
const request = async (req, api) => {
  try {
    if (!req.session.jwt) {
      // 세션이 토큰에 없으면
      const tokenResult = await axios.post(`${URL}/token`, {
        clientSecret: process.env.CLIENT_SECRET,
      });
      req.session.jwt = tokenResult.data.token; // 세션에 토큰 저장
    }
    return await axios.get(`${URL}${api}`, {
      headers: { authorization: req.session.jwt },
    }); // API 요청
  } catch (error) {
    if (error.response.status === 419) {
      // 토큰시간 만료시 토큰 재발급 받기
      delete req.session.jwt;
      return request(req, api);
    } // 419 외 다른 에러면
    return error.response;
  }
};

// await 을 쓰기 위해 async 함수로
router.get("/mypost", async (req, res, next) => {
  try {
    // async 함수를 쓰면 필수로 try ~ catch로 예외처리 해준다.
    const result = await request(req, "/posts/my");
    res.json(result.data);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// await 을 쓰기 위해 async 함수로
router.get("/search/:hashtag", async (req, res, next) => {
  try {
    const result = await request(
      req,
      `/posts/hashtag/${encodeURIComponent(req.params.hashtag)}` // 한글일수도 있으니 안전하게 처리.
    );
    res.json(result.data);
  } catch (error) {
    if (error.code) {
      console.error(error);
      next(error);
    }
  }
});

router.get("/test", async (req, res, next) => {
  // 토큰 테스트 라우터
  try {
    if (!req.session.jwt) {
      // 세션에 토큰이 없으면 토큰 발급 시도
      const tokenResult = await axios.post("http://localhost:8002/v1/token", {
        clientSecret: process.env.CLIENT_SECRET,
      });
      // json으로 보내준게 data안에 들어있다.
      if (tokenResult.data && tokenResult.data.code === 200) {
        // 토큰 발급 성공
        req.session.jwt = tokenResult.data.token; // 세션에 토큰 저장
      } else {
        // 토큰 발급 실패
        return res.json(tokenResult.data); // 발급실패 사유 응답
      }
    }

    const result = await axios.get("http://localhost:8002/v1/test", {
      headers: { authorization: req.session.jwt },
    });
    return res.json(result.data);
  } catch (error) {
    console.error(error);
    if (error.response.status === 419) {
      // 토큰 만료시
      return res.json(error.response.data);
    }
    return next(error);
  }
});

router.get("/", (req, res) => {
  // 서버에서 프론트로 중요한 키를 절대 내려주면 안됌...
  res.render("main", { key: process.env.CLIENT_SECRET });
});

module.exports = router;
