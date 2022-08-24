const Sequelize = require("sequelize");
const env = process.env.NODE_ENV || "development";
const config = require("../config/config")[env]; // config안에 있는 디벨롭먼트 db설정 정보를 가지고 오는것
const User = require("./user");
const Post = require("./post");
const Hashtag = require("./hashtag");

const db = {}; // db객체 만들어주고

const sequelize = new Sequelize( // new Sequelize를 만들어주면 시퀄라이즈 객체를 준다.
  config.database,
  config.username,
  config.password,
  config
);

db.sequelize = sequelize;
db.User = User;
db.Post = Post;
db.Hashtag = Hashtag;

User.init(sequelize);
Post.init(sequelize);
Hashtag.init(sequelize);

User.associate(db);
Post.associate(db);
Hashtag.associate(db);

module.exports = db;
