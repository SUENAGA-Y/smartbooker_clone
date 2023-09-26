const { database } = require("./database");
const { color } = require("./others");

const db = database();

const menuData = async (name) => {
  const menuRef = db.collection("clients").doc(name).collection("menu");
  const menuSnapshot = await menuRef.get();
  const promises = menuSnapshot.docs.map(async (doc) => {
    const menuData = doc.data();
    const buttonRef = doc.ref.collection("button");
    const buttonSnapshot = await buttonRef.get();
    menuData.button = buttonSnapshot.docs.map((buttonDoc) => buttonDoc.data());
    return menuData;
  });
  return Promise.all(promises);
};

exports.course = async (name, docid) => {
  //コース選択
  const payload = {
    type: "flex",
    altText: "this is a flex message",
    contents: {
      type: "carousel",
      contents: [],
    },
  };
  const menuArray = await menuData(name);
  const colorCode = await color(name);
  for (let i = 0; i < menuArray.length; i++) {
    let msg = JSON.parse(courseBubble(menuArray[i], docid, colorCode));
    payload.contents.contents.push(msg);
  }
  return JSON.stringify(payload);
};

const courseBubble = (array, docid, color) => {
  const payload = {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [],
    },
    hero: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "【 " + array.title + " 】",
          size: "xl",
          align: "center",
          weight: "bold",
        },
        {
          type: "text",
          text: "ご希望のコースを選択してください。",
          margin: "sm",
          align: "center",
        },
        {
          type: "text",
          text: "※コース選択後、日付が表示されるまで\nしばらくお待ち下さい。",
          align: "center",
          margin: "md",
          color: "#cc0000",
          wrap: true,
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: JSON.parse(courseButton(array, docid, color)),
      spacing: "xs",
      margin: "xs",
    },
  };
  return JSON.stringify(payload);
};

//コースボタン
const courseButton = (array, docid, color) => {
  const button = array.button;
  const payload = [];
  for (let i = 0; i < button.length; i++) {
    let msg;
    if (button[i].time == "null") {
      msg = {
        type: "text",
        text: button[i].title,
        margin: "sm",
        align: "center",
        wrap: true,
      };
    } else {
      let value = docid + "-" + array.title + "-" + button[i].time + "-" + array.calendar + "-" + button[i].title;
      msg = {
        type: "button",
        action: {
          type: "postback",
          label: button[i].title,
          data: '{"action":"booking","status":"course","value":"' + value + '"}',
          displayText: array.title + "\n" + button[i].title,
        },
        adjustMode: "shrink-to-fit",
        color: color,
        style: "primary",
      };
    }
    payload.push(msg);
  }
  return JSON.stringify(payload);
};
