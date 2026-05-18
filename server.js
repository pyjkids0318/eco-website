const express = require('express');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));


// =========================
// [API] 추천 행동 3개
// =========================
app.get('/api/recommendations', async (req, res) => {

  try {

    const result = await pool.query(
      'SELECT * FROM eco_actions ORDER BY RANDOM() LIMIT 3'
    );

    res.json(result.rows);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});


// =========================
// [API] 누적 탄소 절감량
// =========================
app.get('/api/total-carbon', async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT SUM(e.carbon_saved) as total
      FROM user_logs u
      JOIN eco_actions e
      ON u.action_id = e.id
    `);

    res.json({
      total: parseFloat(result.rows[0].total || 0).toFixed(2)
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});


// =========================
// [API] 행동 리스트
// =========================
app.get('/api/actions', async (req, res) => {

  try {

    const result = await pool.query(
      'SELECT * FROM eco_actions ORDER BY action_name ASC'
    );

    res.json(result.rows);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});


// =========================
// [API] 행동 기록 저장
// =========================
app.post('/api/record', async (req, res) => {

  const { actionId } = req.body;

  try {

    await pool.query(
      'INSERT INTO user_logs (user_id, action_id) VALUES ($1, $2)',
      [1, actionId]
    );

    res.json({
      success: true
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});


// =========================
// [API] 회원가입
// =========================
app.post('/api/signup', async (req, res) => {

  const { username, password, email } = req.body;

  try {

    await pool.query(
      'INSERT INTO users (username, password, email) VALUES ($1, $2, $3)',
      [username, password, email]
    );

    res.redirect('/login.html');

  } catch (err) {

    res.status(500).send("회원가입 실패: " + err.message);

  }

});


// =========================
// [API] 로그인
// =========================
app.post('/api/login', async (req, res) => {

  const { username, password } = req.body;

  try {

    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length > 0) {

      res.json({
        success: true
      });

    } else {

      res.status(401).json({
        success: false,
        message: "아이디 또는 비밀번호가 틀립니다."
      });

    }

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});


// =========================
// 서버 실행
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
