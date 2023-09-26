const line = require("@line/bot-sdk");
const { onRequest } = require("firebase-functions/v2/https");
require("dotenv").config();

const { addNewUser, getNameById } = require("./main/users.js");
const { course } = require("./main/courses.js");
const { addNewBooking, getLatestBooking } = require("./main/booking.js");
const { date } = require("./main/date.js");
const { time } = require("./main/time.js");
const { getCalendars } = require("./main/calendar.js");

const config = {
};

const channelSecretArray = [];

const botIdArray = {};

let lineClient;
let name;

exports.webhook = onRequest(
  {
    region: "asia-northeast1",
    concurrency: 500,
  },
  async (req, res) => {
    res.sendStatus(200);

    if (validate_signature(req, channelSecretArray)) {
      switch (req.body.destination) {

        case botIdArray:
          lineClient = new line.Client(config.);
          name = "";
          break;
        case botIdArray:
          lineClient = new line.Client(config.);
          name = "";
          break;

        default:
          console.log("other");
      }

      const events = req.body.events[0];
      const id = events.source.userId;
      /* ========= LINEBOT ========= */
      if (events.type == "follow") {
        addNewUser(id, name);
        // main.profileEntry(id, name);
      }
      //ブロックされた
      else if (events.type == "unfollow") {
      }
      //postbackイベント
      else if (events.type == "postback") {
        const postback = JSON.parse(events.postback.data);
        /* =============予約============= */
        if (postback.action == "booking") {
          //予約開始
          if (postback.status == "start") {
            const username = await getNameById(id, name);
            const docid = await addNewBooking(id, username, name);
            lineClient.replyMessage(events.replyToken, JSON.parse(await course(name, docid)));
            
          }
          //コース選択完了
          else if (postback.status == "course") {
            const course = postback.value;
            const array = course.split("-");
            const docid = array[0];
            getLatestBooking(name, docid, "course", array[1]);
            getLatestBooking(name, docid, "course_minute", array[2]);
            getLatestBooking(name, docid, "calendar", array[3]);
            getLatestBooking(name, docid, "menu", array[4]);
            lineClient.replyMessage(events.replyToken, JSON.parse(await date(name, docid)));

          }
          //日付選択完了
          else if (postback.status == "date") {
            const date = postback.value;
            const array = date.split("-");
            const docid = array[0];
            getLatestBooking(name, docid, "date", new Date(array[1]));
            lineClient.replyMessage(events.replyToken, JSON.parse(await time(name, docid)));

          }
          //時間選択完了
          else if (postback.status == "time") {
            const time = new Date(postback.value);
            const flg = main.getLatestBooking(id, 7, time, name);
            if (flg == true) {
              main.deleteCellBooking(id, 11, name);
              main.deleteCellBooking(id, 12, name);
              main.conf(replytoken, id, name);
            } else if (flg == false) {
              main.error(replytoken, name);
            } else {
              main.bookingError(replytoken, name);
            }
          }

      //messageイベント
      else if (events.type == "message") {
        //users.getNameById(id, name);
        lineClient.replyMessage(events.replyToken, {
          type: "text",
          text: "メッセージありがとうございます！\nこのアカウントではお問い合わせを受け付けておりません。",
        });
      }
    }
    res.status(200).send();
  }
);

//署名検証関数
const validate_signature = (req, channelSecretArray) => {
  const signature = req.header("x-line-signature") ?? "";
  for (let i = 0; i < channelSecretArray.length; i++) {
    if (line.validateSignature(JSON.stringify(req.body), channelSecretArray[i], signature)) {
      return true;
    }
  }
  return false;
};
