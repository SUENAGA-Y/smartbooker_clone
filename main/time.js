const { database } = require("./database");
const { color } = require("./others");
const { vacantSearch30 } = require("./calendar");

const db = database();

//時間選択
exports.time = async (name, docid) => {
  const payload = {
    type: "flex",
    altText: "this is a flex message",
    contents: {
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
            text: "時間選択",
            size: "xl",
            align: "center",
            weight: "bold",
          },
          {
            type: "text",
            text: "ご希望の時間を選択してください。",
            margin: "sm",
            align: "center",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [],
      },
    },
  };

  /*   for (let i = 4; i <= 6; i++) {
    if (b_sheet.getRange(rowNum, i).isBlank()) {
      getLatestBooking(id, 8, "エラー", name);
      error(replytoken, name);
      return;
    }
  } */

  let array, i;
  const time = (await db.collection()).data().min;
  const colorCode = await color(name);
  if (time == 15) {
    //array = vacantSearch(id, col, name);
  } else if (time == 30) {
    array = await vacantSearch30(name, docid);
  }

  if (array.length == 0) {
    return timeNot();
  } else {
    if (array.length % 2 == 0) {
      for (i = 0; i < array.length; i += 2) {
        let msg = JSON.parse(timeButton(array, i, colorCode, docid));
        payload.contents.body.contents.push(msg);
      }
    } else {
      for (i = 0; i < array.length - 1; i += 2) {
        let msg = JSON.parse(timeButton(array, i, colorCode, docid));
        payload.contents.body.contents.push(msg);
      }
      payload.contents.body.contents.push(JSON.parse(timeLastButton(array, i, colorCode, docid)));
    }
  }
  return JSON.stringify(payload);
};

//日付ボタン
const timeButton = (array, index, color, docid) => {
  const option = {
    hour: "numeric",
    minute: "numeric",
  };
  const msg = {
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "button",
        action: {
          type: "postback",
          label: new Intl.DateTimeFormat("ja-JP", option).format(array[index]),
          data: '{"action":"booking","status":"time","value":"' + docid + "-" + array[index] + '"}',
          displayText: new Intl.DateTimeFormat("ja-JP", option).format(array[index]),
        },
        color: color,
        style: "primary",
      },
      {
        type: "button",
        action: {
          type: "postback",
          label: new Intl.DateTimeFormat("ja-JP", option).format(array[index + 1]),
          data: '{"action":"booking","status":"time","value":"' + docid + "-" + array[index + 1] + '"}',
          displayText: new Intl.DateTimeFormat("ja-JP", option).format(array[index + 1]),
        },
        color: color,
        style: "primary",
      },
    ],
    spacing: "xs",
    margin: "xs",
  };
  return JSON.stringify(msg);
};

//日付ボタン最終行
function timeLastButton(array, index, color, docid) {
  const option = {
    hour: "numeric",
    minute: "numeric",
  };
  const msg = {
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "button",
        action: {
          type: "postback",
          label: new Intl.DateTimeFormat("ja-JP", option).format(array[index]),
          data: '{"action":"booking","status":"time","value":"' + docid + "-" + array[index] + '"}',
          displayText: new Intl.DateTimeFormat("ja-JP", option).format(array[index]),
        },
        color: color,
        style: "primary",
      },
      {
        type: "box",
        layout: "vertical",
        contents: [],
      },
    ],
    spacing: "xs",
    margin: "xs",
  };
  return JSON.stringify(msg);
}

const timeNot = () => {
  const payload = {
    type: "flex",
    altText: "this is a flex message",
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "空きがありません。",
          },
          {
            type: "text",
            text: "もう一度、日付を選択してください。",
            margin: "sm",
          },
        ],
      },
    },
  };
  return JSON.stringify(payload);
};
