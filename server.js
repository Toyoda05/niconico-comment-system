const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server); // Socket.IOをHTTPサーバーにアタッチ

const PORT = process.env.PORT || 3000;

// 静的ファイルの提供 (publicディレクトリを作成し、HTML/CSS/JSを置く)
app.use(express.static(path.join(__dirname, 'public')));

// クライアントからの接続をリッスン
io.on('connection', (socket) => {
    console.log('A user connected');

    // クライアントから'comment'イベントを受信
    socket.on('comment', (msg) => {
        console.log('received comment: ' + msg);
        // 全ての接続中のクライアントに'new comment'イベントをブロードキャスト
        io.emit('new comment', msg);
    });

    // クライアントが切断した場合
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access comment input page at http://localhost:${PORT}/input.html`);
    console.log(`Access comment display page at http://localhost:${PORT}/display.html`);
});