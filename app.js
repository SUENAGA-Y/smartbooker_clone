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
  testv2: {
    channelAccessToken: process.env.TESTV2_ACCESS_TOKEN,
    channelSecret: process.env.TESTV2_SECRET,
  },
  test: {
    channelAccessToken: process.env.TEST_ACCESS_TOKEN,
    channelSecret: process.env.TEST_SECRET,
  },
};

const channelSecretArray = [process.env.TESTV2_SECRET, process.env.TEST_SECRET];

const botIdArray = {
  testv2: process.env.TESTV2_BOTID,
  test: process.env.TEST_BOTID,
};

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
        //testv2
        case botIdArray.testv2:
          lineClient = new line.Client(config.testv2);
          name = "testv2";
          break;
        //test
        case botIdArray.test:
          lineClient = new line.Client(config.test);
          name = "test";
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
            getCalendars();
            /*if (username === "新規") {
            main.profileEntry(id, name);
          } else {
            lineClient.replyMessage(events.replyToken, course.course(name)); //コース選択
            main.addNewBooking(id, username, name);
          } */
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
            /* const flg = main.getLatestBooking(id, 4, array[0], name);
            if (flg == true) {
              //main.date(replytoken, name); //日付選択へ
              main.getLatestBooking(id, 5, array[1], name);
              main.getLatestBooking(id, 6, array[2], name);
              main.freeDate(replytoken, id, name);
              main.getLatestBooking(id, 10, array[3], name);
            } else if (flg == false) {
              main.error(replytoken, name);
            } else {
              main.bookingError(replytoken, name);
            } */
          }
          //日付選択完了
          else if (postback.status == "date") {
            const date = postback.value;
            const array = date.split("-");
            const docid = array[0];
            getLatestBooking(name, docid, "date", new Date(array[1]));
            lineClient.replyMessage(events.replyToken, JSON.parse(await time(name, docid)));
            /*   const flg = main.getLatestBooking(id, 3, date, name);
            if (flg == true) {
              main.time(replytoken, id, name); //時間選択
            } else if (flg == false) {
              main.error(replytoken, name);
            } else {
              main.bookingError(replytoken, name);
            } */
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
          //option選択完了
          else if (postback.status == "option") {
            const option = postback.value;
            const array = option.split("-");
            const flg = main.getLatestBooking(id, 11, array[0], name);
            if (flg == true) {
              main.conf(replytoken, id, name);
              main.getLatestBooking(id, 12, array[1], name);
            } else if (flg == false) {
              main.error(replytoken, name);
            } else {
              main.bookingError(replytoken, name);
            }
          }
          //時間帯選択完了　ベーシックプラン
          else if (postback.status == "conf") {
            if (id == main.masterAccount(name)) {
              main.masterUserList(replytoken, name); //マスター
            } else {
              const flg = main.getLatestBooking(id, 8, "確定", name);
              if (flg == true) {
                main.fin(replytoken, id, name);
              } else if (flg == false) {
                main.error(replytoken, name);
              } else {
                main.bookingError(replytoken, name);
              }
            }
          } else if (postback.status == "userList") {
            /* ======= master（ベーシックプラン） ======= */
            const userId = postback.value;
            main.masterConf(replytoken, id, name, userId);
          } else if (postback.status == "masterConf") {
            const userId = postback.value;
            main.masterFin(replytoken, id, name, userId);
            const flg = main.getLatestBooking(userId, 8, "確定", name);
            if (flg == false) {
              main.error(replytoken, name);
            }
          }
        } else if (postback.action == "other") {
          /* =============メニュー============= */
          if (postback.status == "start") {
            const username = main.getNameById(id, name);
            if (username === "新規") {
              main.profileEntry(id, name);
            } else {
              main.menu(replytoken, name);
            }
          }
          //予約履歴開始
          else if (postback.status == "history") {
            main.history(replytoken, id, name);
          } else if (postback.status == "cancel") {
            const rowNum = postback.value;
            main.cancel(replytoken, rowNum, name);
          } else if (postback.status == "conf") {
            const rowNum = postback.value;
            main.cancelfin(replytoken, rowNum, name);
            main.addRowBooking(rowNum, 8, "キャンセル", name);
          } else if (postback.status == "profile") {
            main.profile(replytoken, id, name);
          } else if (postback.status == "tariff") {
            main.tariff(replytoken, name);
          }
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
