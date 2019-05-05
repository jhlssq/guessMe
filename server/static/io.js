function shangchang() {
    var t = this.in;
    if (this.t) clearTimeout(this.t);
    this.t = setTimeout(function () {
        socket.emit(!t ? 'in' : 'out');
    }, 400);
}
var socket = io.connect();
socket.on('success',function(){
    outAct();
    canvas.isMe = true;
    shangchang();
})
socket.on('othersuccess',function(){
    outAct();
    canvas.isMe = false;
    shangchang();
    
})

socket.on('server msg', function (data) {
    var ele = document.createElement('p');
    ele.innerHTML = data;
    msg.appendChild(ele);
    msg.scrollTop = msg.scrollHeight;
})

socket.on('login', function () {
    if (prompt) {
        showModal();
        var loginName = document.getElementById('loginName');
        var confirmLogin = document.getElementById('confirmLogin');
        confirmLogin.onclick = function () {
        socket.emit('login', loginName.value);
        hideModal();
        outAct();
        canvas.isMe = false;
        shangchang();
        }
    }
    else {
        socket.emit('login', '手机用户');
        outAct();
        canvas.isMe = false;
        shangchang();
    }

});
socket.on('paint paths', function (paths) {
    paths = JSON.parse(paths);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var k in paths) {
        if (paths[k].tag === 'pts')
            Ctl.drawPts(ctx, paths[k]);
        else {
            new Rect(paths[k].x, paths[k].y, paths[k].w, paths[k].h).clearOn(ctx);
        }
    }
});
socket.on('paint pts', function (pts) {
    pts = JSON.parse(pts)
    if (!pts) return;
    Ctl.drawPts(ctx, pts);
});
socket.on('cmd', function (data) {
    console.log(JSON.parse(data));
});
socket.on('reset in users', function (data) {
    data = JSON.parse(data);
    users.innerHTML = '';
    data.forEach(x => {
        users.appendChild(utils.makeUserP(x));
    });
})
socket.on('erase', function (x, y, w, h) {
    new Rect(x, y, w, h).clearOn(ctx);
})
socket.on('new in user', function (data) {
    users.appendChild(utils.makeUserP(JSON.parse(data)));
});
socket.on('out user', function (id) {
    var x = users.querySelector('#p' + id);
    if (x) x.outerHTML = '';
})
socket.on('in', function (data) {
    users.appendChild(utils.makeUserP(JSON.parse(data)));
    users.scrollTop = users.scrollHeight;
    inAct();
});
socket.on('out', function (id) {
    var x = users.querySelector('#p' + id);
    if (x) {
        x.outerHTML = '';
        outAct();
    }
});

socket.on('mytime', function (data) {
    data = JSON.parse(data);// name,word:,time
    info.player.innerText = data.name + '(自己)';
    info.time.innerText = data.time + 's';
    info.word.innerText = data.word;
    canvas.isMe = true;
});
socket.on('othertime', function (data) {
    data = JSON.parse(data);// name,word:,time
    info.player.innerText = data.name;
    info.time.innerText = data.time + 's';
    canvas.isMe = false;
});
socket.on('update time', function (data) {
    data = JSON.parse(data);
    info.player.innerText = data.name;
    info.time.innerText = data.time + 's';
    info.word.innerText = data.word;
});
socket.on('update my time', function (data) {
    data = JSON.parse(data);
    info.time.innerText = data.time + 's';
});

socket.on('mytimeout', function (id) {
    var t = users.querySelector('#p' + id);
    if (t) t.outerHTML = '';
    info.time.innerText = '时间到了！';
    
    outAct();
    canvas.isMe = false;
    shangchang(); 
});

socket.on('timeout', function (d) {
    d = JSON.parse(d);
    var t = users.querySelector('#p' + d.id);
    if (t) t.outerHTML = '';
    info.time.innerText = '时间到了！';
    info.word.innerText = '正确答案为：' + d.word;
    
    outAct();
    canvas.isMe = true;
    shangchang();
    
});


socket.on('clear paint', function () {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
});

utils = {
    makeUserP: function (x) {
        var p = document.createElement('p'); p.id = 'p' + x.id;
        p.innerText = x.name;
        return p;
    }
}
