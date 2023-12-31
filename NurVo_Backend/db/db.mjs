import pg from "pg";
import express from "express";
import dotenv from "dotenv";
import { dateToDay, stringDate } from "../services/attendance.mjs";

dotenv.config();

//데이터베이스 연결 정보
const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_NAME = process.env.DB_NAME;
const DB_PASSWORD = process.env.DB_PASSWORD;

const pool = new pg.Pool({
  host: DB_HOST,
  user: DB_USER,
  database: DB_NAME,
  password: DB_PASSWORD,
});

//사용자 정보 불러오기
export const getUser = async (id) => {
  const client = await pool.connect();
  try {
    if (id) {
      //id가 있으면 해당 id의 유저 정보만 가지고 옴
      const user = await client.query(
        "SELECT * FROM public.user WHERE id = $1",
        [id]
      );
      return user.rows[0];
    } else {
      //id가 없으면 모든 유저 정보를 가지고 옴
      const user = await client.query("SELECT * FROM public.user");
      return user.rows;
    }
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
  }
};

//사용자 정보 저장하기
export const saveUser = async (userInfo) => {
  //userInfo는 id, name, password, email, phone_number를 가지고 있음
  const client = await pool.connect();
  try {
    //회원정보 저장
    const user = await client.query(
      "INSERT INTO public.user (id, name, phone_number, password, nickname) VALUES ($1, $2, $3, $4, $5)",
      [
        userInfo.id,
        userInfo.name,
        userInfo.phone_number,
        userInfo.password,
        userInfo.nickname,
      ]
    );
    return user.rows[0];
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
  }
};

//사용자 정보 수정하기
export const updateUser = async (userInfo) => {
  const client = await pool.connect();
  try {
    //회원정보 수정
    if (!userInfo.obj_date) {
      await client.query("UPDATE public.user SET obj = $1 WHERE id = $2", [
        userInfo.obj,
        userInfo.id,
      ]);
    } else if (!userInfo.obj) {
      await client.query("UPDATE public.user SET obj_date = $1 WHERE id = $2", [
        userInfo.obj_date,
        userInfo.id,
      ]);
    } else {
      await client.query(
        "UPDATE public.user SET obj = $1, obj_date = $2 WHERE id = $3",
        [userInfo.obj, userInfo.obj_date, userInfo.id]
      );
    }
    const user = await client.query("SELECT * FROM public.user WHERE id = $1", [
      userInfo.id,
    ]);
    return user.rows[0];
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
  }
};

//topic 가지고 오는 함수
export const getTopic = async () => {
  const client = await pool.connect();
  try {
    const topic = await client.query("SELECT * FROM topic");

    return topic.rows;
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
  }
};

//chapter 가지고 오는 함수.
export const getChapter = async () => {
  const client = await pool.connect();
  try {
    const chapters = await client.query("SELECT * FROM chapter");
    return chapters.rows;
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
  }
};

//chapter를 학습한 step과 함께 가지고 오는 함수
export const getChapterWithStep = async (user_id) => {
  const client = await pool.connect();
  try {
    const query = `
    SELECT
      c.id,
      c.name,
      e.step
    FROM edu e
    JOIN chapter c ON e.chapter_id = c.id
    WHERE e.user_id = $1
    ORDER BY e.chapter_id ASC
    `;
    const chapters = await client.query(query, [user_id]);
    return chapters.rows;
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
  }
};

//대화문 가지고 오는 함수
export const getDialogues = async (chapter_id) => {
  const client = await pool.connect();
  try {
    if (chapter_id) {
      const conversation = await client.query(
        "SELECT * FROM conversation WHERE chapter_id = $1",
        [chapter_id]
      );
      return conversation.rows;
    } else {
      const conversation = await client.query("select * from conversation");
      return conversation.rows;
    }
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
  }
};

//대화문의 문장을 각 문장의 id로 가지고 오는 함수
export const getSentences = async (id) => {
  const client = await pool.connect();
  try {
    const sentence = await client.query(
      "SELECT * FROM conversation WHERE id = $1",
      [id]
    );
    return sentence.rows[0].dialogue;
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
  }
};

// 문장의 second_step을 문장의 id로 가지고 오는 함수
export const getSecondStep = async (id) => {
  const client = await pool.connect();
  try {
    const sentence = await client.query(
      "select second_step from conversation where id = $1",
      [id]
    );
    return sentence.rows[0].second_step;
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
  }
};

//북마크 저장 함수
export const saveBookemark = async (dialogue_id, user) => {
  const user_id = user || "coco1234"; // test할 때 사용할 계정이 coco1234
  const client = await pool.connect();

  const formattedDate = stringDate();

  let result;

  try {
    await client.query(
      "insert into bookmark (user_id, conversation_id, date) values ($1, $2, $3)",
      [user_id, dialogue_id, formattedDate]
    );
    console.log(user_id, dialogue_id, formattedDate);
    result = "success";
    console.log("북마크 저장 완료");
    return result;
  } catch (err) {
    console.error(err);
    result = "fail";
    return result;
  } finally {
    client.release();
  }
};

export const getBookmark = async (user) => {
  const user_id = user || "coco1234";
  const client = await pool.connect();

  try {
    const bookmark = await client.query(
      "select conversation_id, date from bookmark where user_id = $1",
      [user_id]
    );
    return bookmark.rows;
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
  }
};

export const deleteBookmark = async (dialogue_id, user) => {
  const user_id = user || "coco1234";
  const client = await pool.connect();
  try {
    await client.query(
      "delete from bookmark where user_id = $1 and conversation_id = $2",
      [user_id, dialogue_id]
    );
    console.log("북마크 삭제 완료");
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
  }
};

// 학습 완료 시 저장 -  date, chapter_id, step
export const saveCompletedLearning = async (user_id, data) => {
  const client = await pool.connect();
  try {
    const check = await client.query(
      "select * from edu where user_id = $1 and chapter_id = $2",
      [user_id, data.chapter_id]
    );
    if (check.rows[0]) {
      // 이미 학습한 chapter_id 일 경우 date, step 업데이트
      console.log(check);
      await client.query(
        "update edu set date = $1, step = $2 where user_id = $3 and chapter_id = $4",
        [data.date, data.step, user_id, data.chapter_id]
      );
      console.log("완료된 학습 업데이트 성공");
    } else {
      // 학습하지 않은 chapter_id 일경우 새롭게 insert
      await client.query(
        "insert into edu (id, user_id, date, chapter_id, step) values (default, $1, $2, $3, $4)",
        [user_id, data.date, data.chapter_id, data.step]
      );
      console.log("완료된 학습 저장 성공");
    }
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
  }
};

// 학습완료 내역 불러오기
export const getCompletedChapter = async (user_id) => {
  const client = await pool.connect();
  try {
    const query = `
    SELECT
      t.name as topic_name,
      e.chapter_id,
      c.name as chapter_name,
      e.step,
      TO_CHAR(e.date, 'YYYY-MM-DD') as date
    FROM edu e
    JOIN chapter c ON e.chapter_id = c.id
    JOIN topic t ON c.topic_id = t.id
    WHERE e.user_id = $1
    ORDER BY e.chapter_id ASC
  `;
    const chapter = await client.query(query, [user_id]);
    return chapter.rows;
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
  }
};

export const saveAttendance = async (user_id) => {
  const date = stringDate();
  const day = dateToDay();
  const client = await pool.connect();

  try {
    await client.query(
      "insert into attendance (user_id, date, day) values ($1, $2, $3)",
      [user_id, date, day]
    );
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
  }
};

export const getAttendance = async (user_id) => {
  const client = await pool.connect();

  try {
    const result = await client.query(
      "select * from attendance where user_id=$1",
      [user_id]
    );
    return result.rows;
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
  }
};

// 전체 chapter중 해당 user의 step이 3인 경우를 제외하고 chapter 불러오기(단 이번주에 step3가 된 것은 포함해서 보냄)
export const getAllTodayLessons = async (user_id, day) => {
  const client = await pool.connect();
  try {
    const obj = await client.query(
      "select obj from public.user where id = $1",
      [user_id]
    ); // user obj
    const query = `
    select 
    c.topic_id, t.name as topic_name, c.id as chapter_id, c.name as chapter_name, e.step, TO_CHAR(e.date, 'YYYY-MM-DD') as date
    from chapter c
    left join edu e on e.chapter_id = c.id and e.user_id = $1
    left join topic t on c.topic_id = t.id
    where (e.step <>3 or e.step is null) or (e.date between $3 and $4)
    ORDER BY c.id ASC
    limit $2;
  `;
    const chapter = await client.query(query, [
      user_id,
      obj.rows[0].obj,
      day.monday,
      day.sunday,
    ]);
    return chapter.rows;
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
  }
};
