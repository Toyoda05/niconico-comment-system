const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const schedule = require('node-schedule'); // スケジュール機能のために追加

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// 静的ファイルの提供 (publicディレクトリを作成し、HTML/CSS/JSを置く)
// 'public' ディレクトリが存在しない場合、server.js と同じ階層を静的ファイルとして提供します。
// 今回は`input.html`、`display.html`、`scheduler.html`が同じ階層にあるため、
// `__dirname` を直接指定します。
app.use(express.static(path.join(__dirname)));

// スケジュールされたジョブを管理するための配列
const scheduledJobs = [];

// クライアントからの接続をリッスン
io.on('connection', (socket) => {
    console.log('A user connected');

    // クライアントから'comment'イベントを受信
    socket.on('comment', (msg) => {
        console.log('received comment: ' + msg);
        // 全ての接続中のクライアントに'new comment'イベントをブロードキャスト
        io.emit('new comment', msg);
    });

    // クライアントから'schedule_comment'イベントを受信
    socket.on('schedule_comment', ({ comment, delay }) => {
        const delayMs = parseInt(delay, 10) * 1000; // 遅延時間をミリ秒に変換
        if (isNaN(delayMs) || delayMs < 0) {
            socket.emit('schedule_error', 'Invalid delay time.');
            return;
        }

        console.log(`Scheduling comment "${comment}" to be sent in ${delay} seconds.`);

        // スケジュールされたジョブを作成
        const job = schedule.scheduleJob(Date.now() + delayMs, () => {
            console.log(`Sending scheduled comment: ${comment}`);
            io.emit('new comment', comment); // スケジュールされたコメントをブロードキャスト

            // ジョブが実行されたら、scheduledJobsから削除
            const index = scheduledJobs.findIndex(j => j.id === job.id);
            if (index !== -1) {
                scheduledJobs.splice(index, 1);
            }
        });
        
        // ジョブを追跡するためにIDを付与して保存
        scheduledJobs.push({ id: job.jobId, comment, delay, job });
        socket.emit('schedule_success', `Comment "${comment}" scheduled for ${delay} seconds from now.`);
    });

    // クライアントが切断した場合
    //memo
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access comment input page at http://localhost:${PORT}/input.html`);
    console.log(`Access comment display page at http://localhost:${PORT}/display.html`);
    console.log(`Access comment scheduler page at http://localhost:${PORT}/scheduler.html`); // 新しいページの案内
});