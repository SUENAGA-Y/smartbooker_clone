const { database } = require("./database");
const { timeFormat } = require("./others");

const db = database();

//googleカレンダーを取得
const { google } = require("googleapis");
const privatekey = require("../smartbooker-v2-508eaf2c443e.json"); // サービスアカウントキーのJSONファイルのパスを指定
const authClient = new google.auth.JWT(privatekey.client_email, null, privatekey.private_key, [
  "https://www.googleapis.com/auth/calendar",
]);
const calendar = google.calendar({ version: "v3", auth: authClient });

exports.getCalendars = () => {
  const startTime = performance.now();

  calendar.calendarList.list({}, (err, res) => {
    if (err) {
      console.error("エラーが発生しました:", err);
      return;
    }
    const calendars = res.data.items;
    if (calendars.length) {
      console.log("取得したカレンダーの一覧:");
      calendars.forEach((calendar) => {
        console.log(calendar.summary + "-" + calendar.id);
      });
    } else {
      console.log("カレンダーが見つかりませんでした。");
    }
  });
  const endTime = performance.now();
  const processingTime = endTime - startTime;
  console.log("処理時間（ミリ秒）: ", processingTime);
};

exports.vacantSearch30 = async (name, docid) => {
  const getBookingData = (name, docid) => {
    return db.collection("booking").doc(name).collection("booking").doc(docid).get();
  };

  const getClientInfo = (name, type) => {
    return db.collection("clients").doc(name).collection("info").doc(type).get();
  };

  const [bookingDoc, calendarDoc, timeDoc] = await Promise.all([
    getBookingData(name, docid),
    getClientInfo(name, "calendar"),
    getClientInfo(name, "time"),
  ]);

  const no = bookingDoc.data().calendar;
  const calendarid = calendarDoc.data()[no];
  const date = bookingDoc.data().date.toDate();
  const time = parseInt(bookingDoc.data().course_minute);
  let start = parseInt(timeDoc.data().start_time);
  let end = parseInt(timeDoc.data().end_time);
  let now = new Date();
  let timeArray = [];
  let flg = 0;
  let s_time = new Date(date);
  let e_time = new Date(date);
  let s_hour, s_min, e_hour, e_min;
  const times = [];

  if (s_time.getDate() == now.getDate()) {
    if (now.getHours() > start) {
      if (now.getHours() < end) {
        start = now.getHours();
      } else {
        return timeArray;
      }
    }
  }
  if (time >= 60) {
    e_min = time % 60;
    e_hour = start + Math.floor(time / 60);
  } else {
    e_min = time;
    e_hour = start;
  }

  for (s_hour = start; s_hour < end; s_hour++) {
    for (s_min = 0; s_min < 60; s_min += 30) {
      if (s_time.getDate() == now.getDate() && s_hour == now.getHours() && flg == 0) {
        if (now.getMinutes() < 30) {
          s_min = 30;
          e_min += 30;
        } else {
          s_hour++;
          e_hour++;
        }
        flg = 1;
      }
      s_time.setHours(s_hour);
      s_time.setMinutes(s_min);
      e_time.setHours(e_hour);
      e_time.setMinutes(e_min);

      if (s_time.getHours() >= end) {
        break;
      } else if (e_time.getHours() >= end && e_time.getMinutes() > 0) {
        break;
      }

      times.push({ start: new Date(s_time), end: new Date(e_time) });

      e_min += 30;
    }
  }

  const startTime = performance.now();

  const responses = await Promise.all(
    times.map((timeRange) => {
      return calendar.events.list({
        calendarId: calendarid,
        timeMin: timeFormat(timeRange.start),
        timeMax: timeFormat(timeRange.end),
      });
    })
  );

  const endTime = performance.now();
  const processingTime = endTime - startTime;
  console.log("処理時間（ミリ秒）: ", processingTime);

  for (let i = 0; i < responses.length; i++) {
    const events = responses[i].data.items;
    if (!events.length) {
      timeArray.push(times[i].start);
    }
  }

  return timeArray;
};

/* exports.vacantSearch30 = async (name, docid) => {
  const getBookingData = (name, docid) => {
    return db.collection("booking").doc(name).collection("booking").doc(docid).get();
  };

  const getClientInfo = (name, type) => {
    return db.collection("clients").doc(name).collection("info").doc(type).get();
  };

  const [bookingDoc, calendarDoc, timeDoc] = await Promise.all([
    getBookingData(name, docid),
    getClientInfo(name, "calendar"),
    getClientInfo(name, "time"),
  ]);
  const no = bookingDoc.data().calendar;
  const calendarid = calendarDoc.data()[no];
  const date = bookingDoc.data().date.toDate();
  const time = parseInt(bookingDoc.data().course_minute);
  let start = parseInt(timeDoc.data().start_time);
  let end = parseInt(timeDoc.data().end_time);
  let now = new Date();
  let timeArray = [];
  let flg = 0;
  let s_time = new Date(date);
  let e_time = new Date(date);
  let s_hour, s_min, e_hour, e_min;

  if (s_time.getDate() == now.getDate()) {
    if (now.getHours() > start) {
      if (now.getHours() < end) {
        start = now.getHours();
      } else {
        return timeArray;
      }
    }
  }

  if (time >= 60) {
    e_min = time % 60;
    e_hour = start + Math.floor(time / 60);
  } else {
    e_min = time;
    e_hour = start;
  }

  let promises = [];

  while (s_hour < end) {
    if (s_time.getDate() == now.getDate() && s_hour == now.getHours() && flg == 0) {
      if (now.getMinutes() < 30) {
        s_min = 30;
        e_min += 30;
      } else {
        s_hour++;
        e_hour++;
      }
      flg = 1;
    }
    s_time.setHours(s_hour);
    s_time.setMinutes(s_min);
    e_time.setHours(e_hour);
    e_time.setMinutes(e_min);

    if (s_time.getHours() >= end || (e_time.getHours() >= end && e_time.getMinutes() > 0)) {
      console.log(s_time);
      break;
    }

    // カレンダーAPIのリクエストを小さな時間範囲に制約して実行
    const promise = calendar.events.list({
      calendarId: calendarid,
      timeMin: timeFormat(s_time),
      timeMax: timeFormat(e_time),
    });
    promises.push(promise);
    times.push(new Date(s_time));

    s_min = e_min % 60;
    s_hour += Math.floor(e_min / 60);
    e_min += 30;
  }

  const responses = await Promise.all(promises);

  // レスポンスをチェックして空の場合にのみ時刻を配列に追加
  let currentIndex = 0;
  for (s_hour = start; s_hour < end; s_hour++) {
    for (s_min = 0; s_min < 60; s_min += 30) {
      if (currentIndex >= responses.length) {
        timeArray.push(new Date(date.getFullYear(), date.getMonth(), date.getDate(), s_hour, s_min));
        continue;
      }
      const events = responses[currentIndex].data.items;
      const eventStartTime = events && events.length > 0 ? new Date(events[0].start.dateTime) : null;
      if (
        !events ||
        events.length === 0 ||
        (eventStartTime && eventStartTime.getHours() === s_hour && eventStartTime.getMinutes() === s_min)
      ) {
        currentIndex++;
      } else {
        timeArray.push(new Date(date.getFullYear(), date.getMonth(), date.getDate(), s_hour, s_min));
      }
    }
  }

  return timeArray;
}; */

exports.getFreeSlots = (name, no) => {
  const m_sheet = init(name).sheet.main;
  const b_sheet = init(name).sheet.booking;
  const rowNum = findRowReverse(b_sheet, id, 1);
  const duration = b_sheet.getRange(rowNum, 5).getValue();
  const calendar = initCalendar(calendarCol(b_sheet.getRange(rowNum, 6).getValue()), name);
  let start = m_sheet.getRange("B3").getValue();
  let end = m_sheet.getRange("C3").getValue();
  let start_time = new Date(day);
  start_time.setHours(start);
  start_time.setMinutes(0);
  start_time.setSeconds(0);
  start_time.setMilliseconds(0);
  let end_time = new Date(day);
  end_time.setHours(end);
  end_time.setMinutes(0);
  end_time.setSeconds(0);
  end_time.setMilliseconds(0);

  let events = calendar.getEventsForDay(start_time); // イベントの取得
  let slotStart = start_time; // 空き時間の開始時刻
  let maxEnd = 0;

  for (let i = 0; i < events.length; i++) {
    let event = events[i];
    let eventStart = event.getStartTime();
    let eventEnd = event.getEndTime();

    //休日
    if (start_time >= eventStart && end_time <= eventEnd) {
      return false;
    }
    if (slotStart < eventEnd) {
      //空きの判定
      if (slotStart.getTime() < eventStart.getTime()) {
        let slotEnd = eventStart;
        if (slotEnd.getTime() - slotStart.getTime() >= duration * 60 * 1000) {
          return true;
        }
      }
      slotStart = eventEnd;
      if (maxEnd < eventEnd) {
        maxEnd = eventEnd;
      }
    }
  }

  if (slotStart < end_time) {
    let slotEnd = end_time;
    if (slotEnd.getTime() - maxEnd.getTime() >= duration * 60 * 1000) {
      return true;
    }
  }
  return false;
};

//予定を追加
function addCalender(id, col, name) {
  const info = initCalendar(col, name);
  const b_sheet = initBooking(name);
  const rowNum = findRowReverse(b_sheet, id, 1);
  const username = b_sheet.getRange(rowNum, 2).getValue();
  const course = b_sheet.getRange(rowNum, 4).getValue();
  const time = b_sheet.getRange(rowNum, 5).getValue();
  const courseDetails = b_sheet.getRange(rowNum, 10).getValue();
  const option = b_sheet.getRange(rowNum, 11).getValue() + " ";
  let optionTime = b_sheet.getRange(rowNum, 12).getValue();
  if (b_sheet.getRange(rowNum, 12).isBlank()) {
    optionTime = 0;
  }
  const start_time = new Date(b_sheet.getRange(rowNum, 7).getValue());
  const end_time = new Date(start_time);
  end_time.setMinutes(start_time.getMinutes() + time + optionTime);
  const m_sheet = init(name).sheet.main;
  //const gap = m_sheet.getRange("G3").getValue();
  const u_sheet = init(name).sheet.users;
  const row = findRow(u_sheet, id, 1);
  const phone = u_sheet.getRange(row, 4).getValue();

  const event = info.createEvent("LINE " + username, start_time, end_time, {
    description: "[コース]\n" + course + "\n" + courseDetails + "\n" + option + "\n" + "[電話番号]\n" + phone,
  });
  addLatestBooking(id, 9, event.getId(), name);

  //LINE通知
  const masterId = m_sheet.getRange("B6").getValue();
  const msg =
    "予約\n\n" +
    username +
    "\n" +
    dayjs.dayjs(start_time).locale("ja").format("YYYY年MM月DD日(ddd) HH:mm") +
    "\n" +
    course +
    "\n" +
    courseDetails +
    "\n" +
    option +
    "\n" +
    phone;
  pushMessage(masterId, msg, name);
}

//予定を削除
function deleteCalender(rowNum, col, name) {
  const info = initCalendar(col, name);
  const b_sheet = initBooking(name);
  const event_id = b_sheet.getRange(rowNum, 9).getValue();
  const event = info.getEventById(event_id);
  event.deleteEvent();

  //LINE通知
  const username = b_sheet.getRange(rowNum, 2).getValue();
  const start_time = new Date(b_sheet.getRange(rowNum, 7).getValue());
  const m_sheet = init(name).sheet.main;
  const masterId = m_sheet.getRange("B6").getValue();
  const msg =
    "キャンセル\n\n" + username + "\n" + dayjs.dayjs(start_time).locale("ja").format("YYYY年MM月DD日(ddd) HH:mm");
  pushMessage(masterId, msg, name);
}

//空き時間を調べる
function vacantSearch(id, col, name) {
  const info = initCalendar(col, name);
  const m_sheet = initmain(name);
  const b_sheet = initBooking(name);
  const rowNum = findRowReverse(b_sheet, id, 1);
  const date = dayjs.dayjs(b_sheet.getRange(rowNum, 3).getValue());
  const time = b_sheet.getRange(rowNum, 5).getValue();
  let start = m_sheet.getRange("B3").getValue();
  let end = m_sheet.getRange("C3").getValue();
  let now = dayjs.dayjs().toDate();
  let timeArray = [];
  let flg = 0;
  let s_time = date.toDate();
  let e_time = date.toDate();
  let event;
  let s_hour;
  let s_min;
  let e_hour;
  let e_min;
  if (s_time.getDate() == now.getDate()) {
    if (now.getHours() > start) {
      if (now.getHours() < end) {
        start = now.getHours();
      } else {
        return timeArray;
      }
    }
  }
  if (time >= 60) {
    e_min = time % 60;
    e_hour = start + Math.floor(time / 60);
  } else {
    e_min = time;
    e_hour = start;
  }
  start: for (s_hour = start; s_hour < end; s_hour++) {
    for (s_min = 0; s_min < 60; s_min += 15) {
      if (s_time.getDate() == now.getDate() && s_hour == now.getHours() && flg == 0) {
        if (now.getMinutes() < 15) {
          s_min = 15;
          e_min += 15;
        } else if (now.getMinutes() < 30) {
          s_min = 30;
          e_min += 30;
        } else if (now.getMinutes() < 45) {
          s_min = 45;
          e_min += 45;
        } else {
          s_hour++;
          e_hour++;
        }
        flg = 1;
      }
      s_time.setHours(s_hour);
      s_time.setMinutes(s_min);
      e_time.setHours(e_hour);
      e_time.setMinutes(e_min);
      if (s_time > e_time) {
        break start;
      } else if (e_time.getHours() >= end && e_time.getMinutes() > 0) {
        break start;
      }

      event = info.getEvents(s_time, e_time);
      if (event == "") {
        timeArray.push(dayjs.dayjs(s_time).format("YYYY-MM-DD HH:mm"));
      }
      e_min += 15;
    }
  }
  return timeArray;
}

function vacantSearch30(id, col, name) {
  const info = initCalendar(col, name);
  const m_sheet = initmain(name);
  const b_sheet = initBooking(name);
  const rowNum = findRowReverse(b_sheet, id, 1);
  const date = dayjs.dayjs(b_sheet.getRange(rowNum, 3).getValue());
  const time = b_sheet.getRange(rowNum, 5).getValue();
  let start = m_sheet.getRange("B3").getValue();
  let end = m_sheet.getRange("C3").getValue();
  let now = dayjs.dayjs().toDate();
  let timeArray = [];
  let flg = 0;
  let s_time = date.toDate();
  let e_time = date.toDate();
  let event;
  let s_hour;
  let s_min;
  let e_hour;
  let e_min;
  if (s_time.getDate() == now.getDate()) {
    if (now.getHours() > start) {
      if (now.getHours() < end) {
        start = now.getHours();
      } else {
        return timeArray;
      }
    }
  }
  if (time >= 60) {
    e_min = time % 60;
    e_hour = start + Math.floor(time / 60);
  } else {
    e_min = time;
    e_hour = start;
  }

  start: for (s_hour = start; s_hour < end; s_hour++) {
    for (s_min = 0; s_min < 60; s_min += 30) {
      if (s_time.getDate() == now.getDate() && s_hour == now.getHours() && flg == 0) {
        if (now.getMinutes() < 30) {
          s_min = 30;
          e_min += 30;
        } else {
          s_hour++;
          e_hour++;
        }
        flg = 1;
      }
      s_time.setHours(s_hour);
      s_time.setMinutes(s_min);
      e_time.setHours(e_hour);
      e_time.setMinutes(e_min);
      if (s_time.getHours() >= end) {
        break start;
      } else if (e_time.getHours() >= end && e_time.getMinutes() > 0) {
        break start;
      }

      event = info.getEvents(s_time, e_time);
      if (event == "") {
        timeArray.push(dayjs.dayjs(s_time).format("YYYY-MM-DD HH:mm"));
      }
      e_min += 30;
    }
  }
  return timeArray;
}

function checkCalender(id, col, name) {
  const info = initCalendar(col, name);
  const b_sheet = initBooking(name);
  const rowNum = findRowReverse(b_sheet, id, 1);
  const time = b_sheet.getRange(rowNum, 5).getValue();
  const start_time = new Date(b_sheet.getRange(rowNum, 7).getValue());
  const end_time = new Date(start_time);
  end_time.setMinutes(start_time.getMinutes() + time);
  event = info.getEvents(start_time, end_time);
  if (event == "") {
    return true;
  } else {
    return false;
  }
}

function option(id, name) {
  const info = init(name);
  const m_sheet = info.sheet.main;
  const b_sheet = info.sheet.booking;
  const rowNum = findRowReverse(b_sheet, id, 1);
  const time = b_sheet.getRange(rowNum, 5).getValue();
  const calendarNo = b_sheet.getRange(rowNum, 6).getValue();
  const start_time = new Date(b_sheet.getRange(rowNum, 7).getValue());
  const optionList = m_sheet.getRange(24, 3, 11, 2).getValues();
  const calendar = initCalendar(calendarCol(calendarNo), name);
  const msg = [];
  if (optionList[0][0] != 0) {
    for (let i = 2; i <= optionList[0][0] * 2; i += 2) {
      const end_time = new Date(start_time);
      end_time.setMinutes(start_time.getMinutes() + time + optionList[i][1]);
      event = calendar.getEvents(start_time, end_time);
      if (event == "") {
        msg.push({
          type: "button",
          action: {
            type: "postback",
            label: optionList[i - 1][1],
            data:
              '{"action":"booking","status":"option","value":"' + optionList[i - 1][1] + "-" + optionList[i][1] + '"}',
            displayText: optionList[i - 1][1],
          },
          color: info.color,
          style: "primary",
        });
      }
    }
  }
  return msg;
}

/* function getFreeSlots(id, day, name) {
  const m_sheet = init(name).sheet.main;
  const b_sheet = init(name).sheet.booking;
  const rowNum = findRowReverse(b_sheet, id, 1);
  const duration = b_sheet.getRange(rowNum, 5).getValue();
  const calendar = initCalendar(calendarCol(b_sheet.getRange(rowNum, 6).getValue()), name);
  let start = m_sheet.getRange("B3").getValue();
  let end = m_sheet.getRange("C3").getValue();
  let start_time = new Date(day);
  start_time.setHours(start);
  start_time.setMinutes(0);
  start_time.setSeconds(0);
  start_time.setMilliseconds(0);
  let end_time = new Date(day);
  end_time.setHours(end);
  end_time.setMinutes(0);
  end_time.setSeconds(0);
  end_time.setMilliseconds(0);

  let events = calendar.getEventsForDay(start_time); // イベントの取得
  let slotStart = start_time; // 空き時間の開始時刻
  let maxEnd = 0;

  for (let i = 0; i < events.length; i++) {
    let event = events[i];
    let eventStart = event.getStartTime();
    let eventEnd = event.getEndTime();

    //休日
    if (start_time >= eventStart && end_time <= eventEnd) {
      return false;
    }
    if (slotStart < eventEnd) {
      //空きの判定
      if (slotStart.getTime() < eventStart.getTime()) {
        let slotEnd = eventStart;
        if (slotEnd.getTime() - slotStart.getTime() >= duration * 60 * 1000) {
          return true;
        }
      }
      slotStart = eventEnd;
      if (maxEnd < eventEnd) {
        maxEnd = eventEnd;
      }
    }
  }

  if (slotStart < end_time) {
    let slotEnd = end_time;
    if (slotEnd.getTime() - maxEnd.getTime() >= duration * 60 * 1000) {
      return true;
    }
  }
  return false;
} */

exports.getEvents = (auth) => {
  const calendar = google.calendar({ version: "v3", auth });
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const startOfDay = new Date(now);
  startOfDay.setHours(9, 0, 0, 0);

  const endOfDay = new Date(now);
  endOfDay.setHours(21, 0, 0, 0);

  calendar.events.list(
    {
      calendarId: "primary",
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    },
    (err, res) => {
      if (err) return console.error("The API returned an error:", err);
      const events = res.data.items;
      const busySlots = [];

      if (events.length) {
        events.forEach((event) => {
          const start = new Date(event.start.dateTime);
          const end = new Date(event.end.dateTime);
          busySlots.push({ start: start, end: end });
        });
      }

      const freeSlots = findFreeSlots(startOfDay, endOfDay, busySlots, 30);
      console.log("空き時間:");
      freeSlots.forEach((slot) => {
        console.log(`${slot.start.toLocaleTimeString()} - ${slot.end.toLocaleTimeString()}`);
      });
    }
  );
};

// 空き時間を見つける
function findFreeSlots(startOfDay, endOfDay, busySlots, intervalMinutes) {
  const freeSlots = [];
  let currentStart = new Date(startOfDay);
  let currentEnd = new Date(startOfDay);
  currentEnd.setMinutes(currentEnd.getMinutes() + intervalMinutes);

  while (currentEnd <= endOfDay) {
    if (!busySlots.some((slot) => currentStart >= slot.start && currentStart < slot.end)) {
      freeSlots.push({ start: new Date(currentStart), end: new Date(currentEnd) });
    }

    currentStart = new Date(currentEnd);
    currentEnd = new Date(currentEnd);
    currentEnd.setMinutes(currentEnd.getMinutes() + intervalMinutes);
  }

  return freeSlots;
}
