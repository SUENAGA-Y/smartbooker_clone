const { database } = require("./database");

const db = database();

exports.color = async (name) => {
  const color = (await db.collection()).data().color;
  return color;
};

exports.timeFormat = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+09:00`;
  return formattedDate; // 例: "2023-08-08T13:00:00+09:00"
};
