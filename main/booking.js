const { database } = require("./database");

const db = database();

//idで最新の予約情報を検索してデータを追加
exports.addNewBooking = async (id, username, name) => {
  const bookingCollection = await db.collection();
  const data = {};

  const res = await bookingCollection.add(data);
  return res.id;
};

//idで最新の予約情報を検索してデータを追加
exports.getLatestBooking = async (name, docid, key, val) => {
  const bookingDocument = await db.collection();
  const data = {};
  const res = await bookingDocument.update(data);
  //console.log(res);
};

function getLatestBooking(id, colNum, data, name) {
  const sheet = initBooking(name);
  const rowNum = findRowReverse(sheet, id, 1);
  if (rowNum === 0) {
    return false;
  }
  if (sheet.getRange(rowNum, 8).isBlank()) {
    sheet.getRange(rowNum, colNum).setValue(data);
    return true;
  } else if (sheet.getRange(rowNum, 8).getValue() == "確定") {
    sheet.getRange(rowNum, colNum).setValue(data);
    return;
  } else {
    return false;
  }
}

//idで最新の予約情報を検索してデータを追加
function addLatestBooking(id, colNum, data, name) {
  const sheet = initBooking(name);
  const rowNum = findRowReverse(sheet, id, 1);
  sheet.getRange(rowNum, colNum).setValue(data);
}

function addRowBooking(rowNum, colNum, data, name) {
  const sheet = initBooking(name);
  sheet.getRange(rowNum, colNum).setValue(data);
}

//idで最新の予約情報を検索してその行を消去
function deleteLatestBooking(id, name) {
  const sheet = initBooking(name);
  const rowNum = findLastRow(sheet, "A:A");
  sheet.deleteRows(rowNum, 1);
}

function deleteCellBooking(id, colNum, name) {
  const sheet = initBooking(name);
  const rowNum = findRowReverse(sheet, id, 1);
  sheet.getRange(rowNum, colNum).clear();
}

function searchBooking(id, name) {
  const sheet = initBooking(name);
  const rowNum = findLastRow(sheet, "A:A");
  const values = sheet.getRange();
}
