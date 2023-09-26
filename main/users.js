const { database } = require("./database");

const db = database();

//ユーザ追加
exports.addNewUser = async (id, name) => {
  await db.collection().set({});
};

//ユーザのステータス更新
function updateUser(id, name) {
  const sheet = initUser(name);
  const rowNum = findRow(sheet, id, 1);
  sheet.getRange(rowNum, 5).setValue("unfollow");
}

//idからユーザ名を検索
exports.getNameById = async (id, name) => {
  const userList = db.collection();
  const doc = await userList.get();

  if (!doc.exists) {
    this.addNewUser(id, name);
  } else {
    //console.log(doc.data().name);
  }
  return doc.data().name;
};
