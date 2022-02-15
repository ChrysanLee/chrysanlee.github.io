// ---------------方向盘
// 操作盘直径，中心方向指示盘直径，最大拖拽距离
var joystickLen = 4.9, insideLen = 1.4, maxDragLen = 2.45;
var htmlRem = parseInt($("html").css("font-size").replace("px",""));// html根标签的字体大小
var dragLen = $("html").width()/htmlRem;// 拖动区域宽度
var $joystick = $("#joystick") // 操作盘对象
var $drag = $("#drag") // 拖动有效区域对象
var $inside = $("#inside");     // 白色内盘对象

// 初始化控件大小（宽度、高度）
$joystick.css({"height":(joystickLen-0.35*2) + 'rem',
    "width":(joystickLen-0.35*2) + 'rem',
    "marginLeft": '2.3rem',
    "marginBottom": '5.3rem'});    // 0.5*2是边框
$drag.css({
    // "height":dragLen + 'rem',
    // "width":dragLen + 'rem'
});
$inside.css({"height":(insideLen - 0.21*2) + 'rem',
    "width":(insideLen - 0.21*2) + 'rem',
    "margin":((joystickLen-0.35*2) - insideLen)/2 + 'rem'});  // 高度减去边框

// 下面一些的变量用于实现中心test方块的移动：开始
var speed = 6;
var htmlWidth = parseFloat($("html").css("width").replace("px",""));
var transx=0, transy=0, stepx = 0, stepy = 0;
var moving;

var startX = htmlWidth/4; // 初始点击的位置
var startY = $inside.offset().top-$inside.height()/2 + 20;     // 初始点击的位置
// var startY =515;     // 初始点击的位置
function dealTouch(e){
    e.preventDefault();
    var touch, touches = e.originalEvent.touches;  // 得到手指们
    for(var i=0; i<touches.length; i++){
        // 如果有多个手指，则得到按下inside或者drag的手指
        if(touches[i].target.className == 'drag'){
            touch = touches[i];
            break;
        }
    }
    var x = touch.pageX - startX;
    var y = touch.pageY - startY;

    // 超出最大距离，使用数学中圆的方法，限定x，y在圆的范围
    if(x*x+y*y > (htmlRem*maxDragLen)**2){
        // 更好的办法，使用tan和sin和cos
        tanXY = (Math.abs(y)/Math.abs(x));
        var atanXY = Math.atan(tanXY);
        tempX = Math.cos(atanXY)*htmlRem*maxDragLen
        tempY = Math.sin(atanXY)*htmlRem*maxDragLen
        x = x<0?-tempX:tempX;
        y = y<0?-tempY:tempY;
    }
    switch (true) {
        case (x>22): // 右边
            btDown.directRight();
            btUp.directLeft();
            break;
        case (x<-22): // 左边
            btDown.directLeft();
            btUp.directRight();
            break;
        default:
            btUp.directLeft();
            btUp.directRight();
            break;
    }

    switch (true) {
        case (y>22): // 下
            btDown.directDown();
            btUp.directUp();
            break;
        case (y<-22): //上
            btDown.directUp();
            btUp.directDown();
            break;
        default:
            btUp.directUp();
            btUp.directDown();
            break;
    }
    // 进行移动，主要是中间的小滑块进行移动
    $inside.css('transform', 'translate('+x+'px,'+y+'px)');
    // 当滑动一定距离的时候，做出响应，主要是设置步长
    x = x/(htmlRem*maxDragLen);
    y = y/(htmlRem*maxDragLen);
    stepx = (x==0)?0:x;
    stepy = (y==0)?0:y;
}

// 当用户手指按下的时候
$drag.bind("touchstart",function(e){
    // 初始化中间的小绿点的动画
    dealTouch(e);
})
// 手指移动的时候
$drag.bind('touchmove',function(e){
    dealTouch(e);
});
// 手指离开的时候
$drag.bind("touchend",function(e){
    e.preventDefault();
    $inside.css('transform', 'none');   // 回归位置
    clearInterval(moving);
    btUp.directUp();
    btUp.directDown();
    btUp.directLeft();
    btUp.directRight();
})
// ---------------方向盘



// ---------------游戏装载
console.log($("html").height())
var SCREEN_WIDTH = 256;
var SCREEN_HEIGHT = 240;
var FRAMEBUFFER_SIZE = SCREEN_WIDTH * SCREEN_HEIGHT;

var canvas_ctx, image;
var framebuffer_u8, framebuffer_u32;

var AUDIO_BUFFERING = 512;
var SAMPLE_COUNT = 4 * 1024;
var SAMPLE_MASK = SAMPLE_COUNT - 1;
var audio_samples_L = new Float32Array(SAMPLE_COUNT);
var audio_samples_R = new Float32Array(SAMPLE_COUNT);
var audio_write_cursor = 0,
    audio_read_cursor = 0;

var nes = new jsnes.NES({
    onFrame: function(framebuffer_24) {
        for (var i = 0; i < FRAMEBUFFER_SIZE; i++) framebuffer_u32[i] = 0xFF000000 | framebuffer_24[i];
    },
    onAudioSample: function(l, r) {
        audio_samples_L[audio_write_cursor] = l;
        audio_samples_R[audio_write_cursor] = r;
        audio_write_cursor = (audio_write_cursor + 1) & SAMPLE_MASK;
    },
});

function onAnimationFrame() {
    window.requestAnimationFrame(onAnimationFrame);

    image.data.set(framebuffer_u8);
    canvas_ctx.putImageData(image, 0, 0);
    nes.frame();
}

function audio_remain() {
    return (audio_write_cursor - audio_read_cursor) & SAMPLE_MASK;
}

function audio_callback(event) {
    var dst = event.outputBuffer;
    var len = dst.length;
    if (audio_remain() < AUDIO_BUFFERING) nes.frame();

    var dst_l = dst.getChannelData(0);
    var dst_r = dst.getChannelData(1);
    for (var i = 0; i < len; i++) {
        var src_idx = (audio_read_cursor + i) & SAMPLE_MASK;
        dst_l[i] = audio_samples_L[src_idx];
        dst_r[i] = audio_samples_R[src_idx];
    }

    audio_read_cursor = (audio_read_cursor + len) & SAMPLE_MASK;
}

function nes_init(canvas_id) {
    var canvas = document.getElementById(canvas_id);
    canvas_ctx = canvas.getContext("2d");
    image = canvas_ctx.getImageData(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    canvas_ctx.fillStyle = "black";
    canvas_ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Allocate framebuffer array.
    var buffer = new ArrayBuffer(image.data.length);
    framebuffer_u8 = new Uint8ClampedArray(buffer);
    framebuffer_u32 = new Uint32Array(buffer);

    // Setup audio.
    var audio_ctx = new window.AudioContext();
    var script_processor = audio_ctx.createScriptProcessor(AUDIO_BUFFERING, 0, 2);
    script_processor.onaudioprocess = audio_callback;
    script_processor.connect(audio_ctx.destination);
}

function nes_boot(rom_data) {
    nes.loadROM(rom_data);
    window.requestAnimationFrame(onAnimationFrame);
}

function nes_load_data(canvas_id, rom_data) {
    nes_init(canvas_id);
    nes_boot(rom_data);
}

function nes_load_url(canvas_id, path) {
    nes_init(canvas_id);

    var req = new XMLHttpRequest();
    req.open("GET", path);
    req.overrideMimeType("text/plain; charset=x-user-defined");
    req.onerror = () => console.log(`Error loading ${path}: ${req.statusText}`);

    req.onload = function() {
        if (this.status === 200) {
            nes_boot(this.responseText);
        } else if (this.status === 0) {
            alert('加载失败，选其他的吧.')
            // Aborted, so ignore error
        } else {
            alert('加载失败，选其他的吧.')
            req.onerror();
        }
    };

    req.send();
}
// ---------------游戏装载
// ---------------点击事件
var player = 1;
// 定义点击事件
var btDown = {
    select: function() {
        nes.buttonDown(player, jsnes.Controller.BUTTON_SELECT); // player key
    },
    start: function() {
        nes.buttonDown(player, jsnes.Controller.BUTTON_START); // player key
    },
    a: function() {
        nes.buttonDown(player, jsnes.Controller.BUTTON_A); // player key
    },
    b: function() {
        nes.buttonDown(player, jsnes.Controller.BUTTON_B); // player key
    },
    directUp: function() {
        nes.buttonDown(player, jsnes.Controller.BUTTON_UP); // player key
    },
    directDown: function() {
        nes.buttonDown(player, jsnes.Controller.BUTTON_DOWN); // player key
    },
    directLeft: function() {
        nes.buttonDown(player, jsnes.Controller.BUTTON_LEFT); // player key
    },
    directRight: function() {
        nes.buttonDown(player, jsnes.Controller.BUTTON_RIGHT); // player key
    }
}
var btUp = {
    select: function() {
        nes.buttonUp(player, jsnes.Controller.BUTTON_SELECT);
    },
    start: function() {
        nes.buttonUp(player, jsnes.Controller.BUTTON_START);
    },
    a: function() {
        nes.buttonUp(player, jsnes.Controller.BUTTON_A);
    },
    b: function() {
        console.log('bUp ')
        nes.buttonUp(player, jsnes.Controller.BUTTON_B);
    },
    directUp: function() {
        nes.buttonUp(player, jsnes.Controller.BUTTON_UP);
    },
    directDown: function() {
        nes.buttonUp(player, jsnes.Controller.BUTTON_DOWN);
    },
    directLeft: function() {
        nes.buttonUp(player, jsnes.Controller.BUTTON_LEFT);
    },
    directRight: function() {
        nes.buttonUp(player, jsnes.Controller.BUTTON_RIGHT);
    }
}
// 连续按B（攻击）
var alwaysClickBFlag = '';
function alwaysClickB (){
    if(alwaysClickBFlag){
        clearInterval(alwaysClickBFlag);
        btUp.b();
        alwaysClickBFlag = '';
    }
    btDown.b();
    setTimeout(btUp.b, 150)
    alwaysClickBFlag = setInterval(function(){
        btDown.b();
        setTimeout(btUp.b, 150)
    }, 300);
}
// ---------------点击事件
$("#btSelect").on("touchstart", btDown.select)
$("#btSelect").on("touchend", btUp.select)

$("#btPauseSelect").click(function() {
    btDown.start();
    setTimeout(btUp.start, 200);
    $("#nes-canvas").hide();
    $("#nes-select").show()
});

$("#btStart").on("touchstart", btDown.start)
$("#btStart").on("touchend", btUp.start)

// 跳跃
$("#btA").on("touchstart", btDown.a)
$("#btA").on("touchend", btUp.a)
// 攻击
$("#btB").on("touchstart", alwaysClickB)
$("#btB").on("touchend", function () {
    if(alwaysClickBFlag){
        clearInterval(alwaysClickBFlag);
    }
})
// 组合键
$("#btAB").on("touchstart", function () {
    btDown.b();
    btDown.a();
})
$("#btAB").on("touchend", function () {
    btUp.a();
    btUp.b();
})

$("#btOnlyA").on("touchstart", function () {
    btDown.b();
})
$("#btOnlyA").on("touchend", function () {
    btUp.b();
})

var secreenShow = {
    showGame: function () {
        btDown.start();
        setTimeout(btUp.start, 200);
        $("#nes-canvas").show();
        $("#nes-select").hide()
    },
    showList: function () {
        $("#nes-select").show()
        $("#nes-canvas").hide();
        btDown.start();
        setTimeout(btUp.start, 200);
    }
}

//
var selectGameId = undefined;
var selectNesId = '';
function selectGame(id, nes){
    if(!selectGameId){
        selectGameId = id
        $("#gameId" + selectGameId).removeClass('chooseGame_N')
        $("#gameId" + selectGameId).addClass('chooseGame_Y')
    }else{
        $("#gameId" + selectGameId).removeClass('chooseGame_Y')
        $("#gameId" + selectGameId).addClass('chooseGame_N')
        selectGameId = id;
        $("#gameId" + selectGameId).removeClass('chooseGame_N')
        $("#gameId" + selectGameId).addClass('chooseGame_Y')
    }
    selectNesId = nes;
}
function sureLoadNewNes(){
    var path = "./static/gameNes/" + selectNesId;
    var req = new XMLHttpRequest();
    req.open("GET", path);
    req.overrideMimeType("text/plain; charset=x-user-defined");
    req.onerror = () => console.log(`Error loading ${path}: ${req.statusText}`);

    req.onload = function() {
        if (this.status === 200) {
            nes.loadROM(this.responseText);
            secreenShow.showGame();
        } else if (this.status === 0) {
            alert('加载失败，选其他的吧.')
            // Aborted, so ignore error
        } else {
            alert('加载失败，选其他的吧.')
            req.onerror();
        }
    };
    req.send();
    // nes_load_url("nes-canvas", path);
}


// 初始化选择列表
var itemWrapContent = '<div class="gameListWrap">@itemWrap</div>';
var itemWrapContentItem =
    '<div class="game">@itemListMax5</div>';
var itemContent =
    '<div class="item chooseGame_N" onclick="selectGame(\'@indexLess1\', \'@nesName\')" id="gameId@indexLess1">' +
    '<img src="./static/gameImage/@nesImg" style="width: 100%;height: 80%">' +
    '<span style="font-size: 1px;">@nesDesc</span>' +
    '</div>';

var itemContentFinal = '';
var innerItemList = '';
for(var i=0; i<gamelist.length; i++){
    var index = i + 1;

    if (i % 5 == 0 && index>1) { // 换行
        itemContentFinal = itemContentFinal+ itemWrapContentItem.replace(
            '@itemListMax5', innerItemList)
        innerItemList = '';
    }
    innerItemList = innerItemList + itemContent.replace(/@indexLess1/g, index).
    replace(/@nesName/g, gamelist[i].name).
    replace(/@nesImg/g, gamelist[i].img).
    replace(/@nesDesc/g, gamelist[i].desc);
}
if(innerItemList){
    itemContentFinal = itemContentFinal+ itemWrapContentItem.replace(
        '@itemListMax5', innerItemList)
}
$('#nes-select').append(itemWrapContent.replace('@itemWrap', itemContentFinal));
var listOperateor = '<div>\n' +
    '                <div style="text-align:center;width: 134px;margin: auto;padding: 10px 0 ;overflow: hidden;">\n' +
    '                    <div class="footer_btn footer_play_back" onclick="secreenShow.showGame()"></div>\n' +
    '                    <div class="footer_btn footer_btn_none_margin footer_play_go" onclick="sureLoadNewNes()"></div>\n' +
    '                </div>\n' +
    '            </div>';
$('#nes-select').append(listOperateor);
// 加载
nes_load_url("nes-canvas", "./static/gameNes/" + loadingGame);
// nes_load_url("nes-canvas", "./static/gameNes/魂斗罗1 (U)30S.nes");