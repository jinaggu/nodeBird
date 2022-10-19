const Sequelize = require("sequelize");

module.exports = class Domain extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        host: {
          type: Sequelize.STRING(80),
          allowNull: false,
        },
        type: {
          // 나중에 요금제 따질 때.
          type: Sequelize.ENUM("free", "premium"),
          allowNull: false,
        },
        clientSecret: {
          // 예를 들어 카카오면 restApi Key 같은 것
          type: Sequelize.UUIDV4,
          allowNull: false,
        },
      },
      {
        sequelize,
        timestamps: true,
        paranoid: true,
        modelName: "Domain",
        tableName: "domains",
      }
    );
  }

  static associate(db) {
    db.Domain.belongsTo(db.User);
  }
};
