const { database } = require("./database");

const db = database();

//ユーザ追加
exports.addNewUser = async (id, name) => {
  await db.collection("users").doc(name).collection("userList").doc(id).set({
    user_id: id,
    name: "新規",
    furigana: "未登録",
    phone: "未登録",
  });
};

//ユーザのステータス更新
function updateUser(id, name) {
  const sheet = initUser(name);
  const rowNum = findRow(sheet, id, 1);
  sheet.getRange(rowNum, 5).setValue("unfollow");
}

//idからユーザ名を検索
exports.getNameById = async (id, name) => {
  const userList = db.collection("users").doc(name).collection("userList").doc(id);
  const doc = await userList.get();

  if (!doc.exists) {
    this.addNewUser(id, name);
  } else {
    //console.log(doc.data().name);
  }
  return doc.data().name;
  /* 
  if (snapshot.empty) {
    console.log("No matching documents.");
    return;
  }
  snapshot.forEach((doc) => {
    console.log(snapshot);
  }); */
  /*     .then((snapshot) => {
      snapshot.forEach((doc) => {
        console.log(doc.data().name);
      });
    })
    .catch((err) => {
      console.log("Error getting documents", err);
    }); */
};
