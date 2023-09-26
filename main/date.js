const { database } = require("./database");
const { color } = require("./others");

//日付選択
exports.date = async (name, docid) => {
  let date = new Date();
  const colorCode = await color(name);

  const payload = {
    type: "flex",
    altText: "this is a flex message",
    contents: {
      type: "carousel",
      contents: [],
    },
  };

  for (let i = 0; i < 30; i += 7) {
    let sendDate = new Date(date);
    const msg = JSON.parse(dateBubble(new Date(sendDate.setDate(date.getDate() + i)), colorCode, docid));
    payload.contents.contents.push(msg);
  }

  return JSON.stringify(payload);
};

//日付選択画面
const dateBubble = (date, color, docid) => {
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
          text: "日付選択",
          size: "xl",
          align: "center",
          weight: "bold",
        },
        {
          type: "text",
          text: "ご希望の日付を選択してください。",
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
  };

  for (let i = 0; i < 6; i += 2) {
    const sendDate = new Date(date);
    const msg = JSON.parse(dateButton(new Date(sendDate.setDate(date.getDate() + i)), color, docid));
    payload.body.contents.push(msg);
  }
  payload.body.contents.push(JSON.parse(dateLastBotton(new Date(date.setDate(date.getDate() + 6)), color, docid)));
  return JSON.stringify(payload);
};

//日付ボタン
const dateButton = (date, color, docid) => {
  const day = new Date(date);
  day.setDate(day.getDate() + 1);

  const shortOption = {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  };
  const longOption = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  };

  const msg = {
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "button",
        action: {
          type: "postback",
          label: new Intl.DateTimeFormat("ja-JP", shortOption).format(date),
          data:
            '{"action":"booking","status":"date","value":"' +
            docid +
            "-" +
            new Intl.DateTimeFormat("ja-JP", longOption).format(date) +
            '"}',
          displayText: new Intl.DateTimeFormat("ja-JP", shortOption).format(date),
        },
        color: color,
        style: "primary",
      },
      {
        type: "button",
        action: {
          type: "postback",
          label: new Intl.DateTimeFormat("ja-JP", shortOption).format(day),
          data:
            '{"action":"booking","status":"date","value":"' +
            docid +
            "-" +
            new Intl.DateTimeFormat("ja-JP", longOption).format(day) +
            '"}',
          displayText: new Intl.DateTimeFormat("ja-JP", shortOption).format(day),
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
const dateLastBotton = (date, color, docid) => {
  const shortOption = {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  };
  const longOption = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  };

  const msg = {
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "button",
        action: {
          type: "postback",
          label: new Intl.DateTimeFormat("ja-JP", shortOption).format(date),
          data:
            '{"action":"booking","status":"date","value":"' +
            docid +
            "-" +
            new Intl.DateTimeFormat("ja-JP", longOption).format(date) +
            '"}',
          displayText: new Intl.DateTimeFormat("ja-JP", shortOption).format(date),
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
};
