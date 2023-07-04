const line = require("@line/bot-sdk");
const { onRequest } = require("firebase-functions/v2/https");
require("dotenv").config();

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const lineClient = new line.Client(config);

exports.webhook = onRequest((req, res) => {
  res.sendStatus(200);
  const events = req.body.events[0];

  //署名の検証
  if (validate_signature(req.headers["x-line-signature"], req.body, config.channelSecret)) {
    //mmessage送信
    lineClient.replyMessage(events.replyToken, {
      type: "text",
      text: "Hello World!!!",
    });
  } else {
    console.log("fail to validate signature");
  }
  res.status(200).send();
});

//署名検証関数
const validate_signature = (signature, body, lineChannelSecret) => {
  const crypto = require("crypto");
  const LINE_CHANNEL_SECRET = lineChannelSecret;
  return (
    signature ==
    crypto
      .createHmac("sha256", LINE_CHANNEL_SECRET)
      .update(Buffer.from(JSON.stringify(body)))
      .digest("base64")
  );
};
