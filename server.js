const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));


// =====================
// 추천 행동
// =====================
app.get('/api/recommendations', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM eco_actions ORDER BY RANDOM() LIMIT 3'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// =====================
// 🔥 추가된 부분: 행동 목록
// =====================
app.get('/api/actions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, action_name, carbon_saved
      FROM eco_actions
      ORDER BY id
    `);

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// =====================
// 유저별 탄소량
// =====================
app.get('/api/total-carbon', async (req, res) => {

  const { username } = req.query;

  try {

    if (!username || username === "null") {
      return res.json({ total: "0.00" });
    }

    const result = await pool.query(`
      SELECT SUM(e.carbon_saved) as total
      FROM user_logs u
      JOIN eco_actions e ON u.action_id = e.id
      JOIN users us ON u.user_id = us.id
      WHERE us.username = $1
    `, [username]);

    res.json({
      total: Number(result.rows[0].total || 0).toFixed(2)
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }

});


// =====================
// 행동 기록
// =====================
app.post('/api/record', async (req, res) => {

  const { actionId, username } = req.body;

  try {

    const userResult = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false });
    }

    const userId = userResult.rows[0].id;

    await pool.query(
      'INSERT INTO user_logs (user_id, action_id) VALUES ($1, $2)',
      [userId, actionId]
    );

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// =====================
// 회원가입
// =====================
app.post('/api/signup', async (req, res) => {

  const { username, password, email } = req.body;

  try {

    await pool.query(
      'INSERT INTO users (username, password, email) VALUES ($1, $2, $3)',
      [username, password, email]
    );

    res.redirect('/login.html');

  } catch (err) {
    res.status(500).send(err.message);
  }
});


// =====================
// 로그인
// =====================
app.post('/api/login', async (req, res) => {

  const { username, password } = req.body;

  try {

    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length > 0) {
      res.json({
        success: true,
        username
      });
    } else {
      res.status(401).json({ success: false });
    }

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
