
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

const lobbies = {};
const maxLobbies = 10;
const questions = [
  ["house", "Haus"], ["dog", "Hund"], ["cat", "Katze"],
  ["car", "Auto"], ["book", "Buch"], ["sun", "Sonne"],
  ["moon", "Mond"], ["water", "Wasser"], ["tree", "Baum"],
  ["school", "Schule"], ["pen", "Stift"], ["friend", "Freund"],
  ["love", "Liebe"], ["music", "Musik"], ["food", "Essen"]
];

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

app.post("/create-lobby", (req, res) => {
  if (Object.keys(lobbies).length >= maxLobbies) {
    return res.status(400).json({ error: "Maximale Lobby-Anzahl erreicht" });
  }
  let code;
  do {
    code = generateCode();
  } while (lobbies[code]);
  lobbies[code] = {
    players: [],
    status: "waiting",
    questions: [...questions].sort(() => 0.5 - Math.random()).slice(0, 15),
    scores: {},
    responses: {},
    current: 0
  };
  res.json({ code });
});

app.post("/join-lobby", (req, res) => {
  const { code, player } = req.body;
  const lobby = lobbies[code];
  if (!lobby) return res.json({ error: "Lobby nicht gefunden" });
  if (lobby.players.includes(player)) return res.json({ ok: true });
  if (lobby.players.length >= 2) return res.json({ error: "Lobby ist voll" });
  lobby.players.push(player);
  lobby.scores[player] = 0;
  if (lobby.players.length === 2) lobby.status = "started";
  res.json({ ok: true });
});

app.get("/lobby-status/:code", (req, res) => {
  const code = req.params.code;
  const lobby = lobbies[code];
  if (!lobby) return res.json({ error: "Lobby existiert nicht" });
  res.json({ status: lobby.status });
});

app.get("/next-question/:code", (req, res) => {
  const code = req.params.code;
  const lobby = lobbies[code];
  if (!lobby || lobby.current >= lobby.questions.length) return res.json({ done: true });
  const q = lobby.questions[lobby.current];
  res.json({ word: q[0] });
});

app.post("/answer", (req, res) => {
  const { code, player, answer } = req.body;
  const lobby = lobbies[code];
  if (!lobby) return res.json({ error: "Ungültige Lobby" });
  const correct = lobby.questions[lobby.current][1].toLowerCase();
  if (!lobby.responses[lobby.current]) lobby.responses[lobby.current] = {};
  if (lobby.responses[lobby.current][player]) return res.json({});
  lobby.responses[lobby.current][player] = answer;
  if (answer.toLowerCase() === correct) lobby.scores[player]++;
  if (Object.keys(lobby.responses[lobby.current]).length === 2) lobby.current++;
  res.json({ ok: true });
});

app.get("/results/:code", (req, res) => {
  const lobby = lobbies[req.params.code];
  if (!lobby) return res.json({});
  const p = lobby.players;
  const scores = lobby.scores;
  const result = {
    [p[0]]: scores[p[0]] || 0,
    [p[1]]: scores[p[1]] || 0
  };
  res.json(result);
});

app.listen(PORT, () => {
  console.log("Server läuft auf Port " + PORT);
});
