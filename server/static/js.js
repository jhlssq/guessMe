function showModal() {
    document.getElementById('inputName').style.display = 'block';
}
function hideModal() {
    document.getElementById('loginName').value = '';
    document.getElementById('inputName').style.display = 'none';
}

let inAct = function () {
    this.in = true;
};
let outAct = function () {
    this.in = false;
    this.disabled = false;
}
var canvas = document.getElementsByTagName('canvas')[0],
    ctx = canvas.getContext('2d'),
    msg = document.getElementById('msg'),
    ranger = document.getElementById('ranger');

let lineColor = document.getElementById("lineColor"),
    pencil = document.getElementById("pencil"),
    brush = document.getElementById("brush"),
    mul = document.getElementById("mul");
lineColor.onchange = function(e) {
    isEraser = false;
    if(this.value !== "#ffffff")
        document.getElementById("colorIcon").style.color = this.value;
    ctx.closePath();
    color = this.value;
    Ctl.setColor(this.value)
};


pencil.onclick = function(e){
    Ctl.setStyle("normal");
};

brush.onclick = function(e){
    Ctl.setStyle("brush");
};

mul.onclick = function(e){
    Ctl.setStyle("mul");
};

var input = document.getElementById('input-msg'),
    users = document.getElementById('div-users'),
    info = document.getElementById('info');


info.time = info.querySelector('#time')
info.player = info.querySelector('#player')
info.word = info.querySelector('#word')

window.onload = function () {
    Ctl.init();
    function resize() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.paths = canvas.pts = [];
        socket.emit('repaint');
    }
    this.addEventListener('resize', resize);
    resize();
    input.onkeydown = function (e) {
        if (e.keyCode === 13 && this.value != '') {
            if (canvas.isMe) {
                alert('绘图者不能够发送消息！');
                return;
            }
            socket.emit('client msg', this.value);
            this.value = '';
        }
    }
    document.querySelector('#btns').addEventListener('click', function (e) {
        if (e.target.classList.contains('btn-active-able')) {
            if (this.prevBtn) {
                this.prevBtn.classList.remove('active')
            }
            e.target.classList.add('active')
            this.prevBtn = e.target;
        }
    }, true);
}

canvas.addEventListener('mousemove', function (e) {
    var w = 20, h = 20;
    if (canvas.isMe) {
        var x = e.offsetX, y = e.offsetY;
        if (e.buttons === 1) {
            if (!this.erase) {
                Ctl.addPos(x, y);
                Ctl.drawPts(ctx, this.pts);
                socket.emit('paint', JSON.stringify({ data: new Path(this.pts), status: 'ing' }))
            } else {
                var rect = new Rect(x - (w >>> 1), y - (h >>> 1), w, h);
                rect.clearOn(ctx);
                socket.emit('erase', rect.x, rect.y, rect.w, rect.h);
            }
        }
    }
});

canvas.addEventListener('mouseup', function (e) {
    if (!canvas.isMe || this.erase) return;
    var x = e.offsetX, y = e.offsetY;
    Ctl.addPos(x, y);
    Ctl.addPath(this.pts);
    socket.emit('paint', JSON.stringify({ data: new Path(this.pts), status: 'end' }));
    Ctl.clearPos();

})

canvas.addEventListener('mousedown', function (e) {
    if (!this.isMe) return;
    if (this.erase) {
        var w = 20, h = 20;
        var rect = new Rect(x - (w >>> 1), y - (h >>> 1), w, h);
        rect.clearOn(ctx);
        socket.emit('erase', rect.x, rect.y, rect.w, rect.h);
        return;
    }
    var x = e.offsetX, y = e.offsetY;
    Ctl.clearPos();
    Ctl.addPos(x, y);
});

ranger.addEventListener('change', function (e) {
    this.nextElementSibling.innerText = this.value;
    Ctl.setLw(this.value);
});

// Controller
Ctl = {
    drawPts: function (ctx, pts) {
        if (pts instanceof Path || pts.pts) {

            var color = pts.color, lw = pts.lw;
            var s = pts.style;
            pts = pts.pts;
        }
        // console.log(pts)
        ctx.lineJoin = ctx.lineCap = "round";
        // var s = pts.style || style;
        let tmpS = s || canvas.lineStyle;
        // console.log(tmpS)
        switch(tmpS){
            case "brush":
                ctx.shadowBlur = 5;
                ctx.shadowColor = color || canvas.color;
                var p1 = pts[0];
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                pts.slice(1).forEach(v => {
                    ctx.lineTo(v.x, v.y);
                });
                break;
            case "mul":
            // console.log("in mul")
                ctx.shadowBlur = 0;
                this.strokeLine(this.offsetPoints(pts,-8));
                this.strokeLine(this.offsetPoints(pts,-4));
                this.strokeLine(pts);
                this.strokeLine(this.offsetPoints(pts,4));
                this.strokeLine(this.offsetPoints(pts,8));
                break;
            default:
                ctx.shadowBlur = 0;
                var p1 = pts[0];
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                pts.slice(1).forEach(v => {
                    ctx.lineTo(v.x, v.y);
                });
                break;
        }
        ctx.lineWidth = lw || canvas.lw
        ctx.strokeStyle = color || canvas.color;
        ctx.stroke();
        ctx.restore();
    },
    init: function () {
        canvas.paths = [];
        canvas.pts = [];
        canvas.color = 'black';
        canvas.lineStyle="normal";
        canvas.lw = 1;
    },
    setLw(lw) {
        canvas.lw = lw;
    },
    setColor(c) {
        canvas.color = c;
    },
    setStyle(s){
        canvas.lineStyle = s;
    },
    addPath: function (pts) {
        canvas.paths.push(new Path(pts, canvas.lw, canvas.color,canvas.lineStyle));
    },
    addPos: function (x, y) {
        canvas.pts.push(new Pos(x, y));
    },
    clearPos: function () {
        canvas.pts = []
    },
    random: function (b) {
        return Math.floor(Math.random() * b);
    },

    midPointBtw:function(p1, p2) {
        return {
            x: p1.x + (p2.x - p1.x) / 2,
            y: p1.y + (p2.y - p1.y) / 2
        };
    },
    offsetPoints:function(points,val) {
        var offsetPoints = [ ];
        for (var i = 0; i < points.length; i++) {
            offsetPoints.push({
            x: points[i].x + val,
            y: points[i].y + val
        });
      }
      return offsetPoints;
    },
    strokeLine(p){
        var p1 = p[0];
        var p2 = p[1];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        for (var i = 1, len = p.length; i < len; i++) {
            var midPoint = this.midPointBtw(p1, p2);
            ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
            p1 = p[i];
            p2 = p[i+1];
        }
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
    },
};




// model

function Pos(x, y) {
    this.x = x; this.y = y;
}

function Path(pts, lw, color,style) {
    this.pts = pts;
    this.lw = lw || canvas.lw;
    this.color = color || canvas.color;
    this.style = style || canvas.lineStyle;
}

function Rect(x, y, w, h) {
    this.x = x; this.y = y; this.w = w; this.h = h;
}


Rect.prototype.clearOn = function (ctx) {
    ctx.clearRect(this.x, this.y, this.w, this.h);
}
