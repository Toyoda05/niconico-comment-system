const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 'public' フォルダを静的ファイル（HTML, CSS, JS）の置き場所として設定
app.use(express.static(path.join(__dirname, 'public')));

// 各ページへのルート設定
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'input.html'));
});

app.get('/display', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'display.html'));
});

app.get('/reserve', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reserve.html'));
});


// Socket.IOの接続処理
io.on('connection', (socket) => {
  console.log('ユーザーが接続しました。');

  // 通常のコメントを受信し、全クライアントにブロードキャスト
  socket.on('comment', (msg) => {
    console.log('受信コメント: ' + msg);
    // 'new comment' イベントを display.html に向けて送信
    io.emit('new comment', msg);
  });

  // 予約コメントを受信し、タイマーを設定
  socket.on('reserve comment', (data) => {
    const { text, delay } = data;
    const delayMs = parseInt(delay, 10) * 1000;
    
    console.log(`予約コメント: "${text}" を ${delay} 秒後に設定しました。`);

    if (isNaN(delayMs) || delayMs <= 0) {
      console.error('無効な遅延時間です。');
      return;
    }

    // 指定された時間後にコメントを送信
    setTimeout(() => {
      console.log(`送信（予約分）: "${text}"`);
      io.emit('new comment', text);
    }, delayMs);
  });

  socket.on('disconnect', () => {
    console.log('ユーザーが切断しました。');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`サーバーがポート ${PORT} で起動しました。 http://localhost:${PORT}`);
});