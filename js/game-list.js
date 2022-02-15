var loadingGame = '超级玛莉.nes';
var gamelist = [
    {name:"180_梦的探险者.nes",desc:"梦之探险者",img:"梦的探险者.png"},
    {name:"坦克大战.nes",desc:"坦克大战",img:"坦克大战.png"},
    {name:"雪人兄弟.NES",desc:"雪人兄弟",img:"雪人兄弟.png"},
    {name:"Kero Kero Keroppi no Daibouken 2 - Donuts Ike ha Oosawagi! (Japan).nes",desc:"大眼蛙",img:"大眼蛙.png"},
    {name:"古巴英雄.nes",desc:"古巴英雄",img:"古巴英雄.png"},

    {name:"超级玛莉.nes",desc:"超级玛莉",img:"mario.jpg"},
    {name:"超级马莉欧兄弟3(v20090423)[Nokoh汉化].nes",desc:"超级玛丽3",img:"超级玛丽3.png"},

    {name:"松鼠1.nes",desc:"松鼠1",img:"松鼠1.png"},
    {name:"松鼠2.nes",desc:"松鼠2",img:"松鼠2.png"},

    {name:"三目童子.nes",desc:"三目童子",img:"三目童子.png"},

    {name:"成龙之龙.nes",desc:"成龙之龙",img:"成龙之龙.png"},
    {name:"快打旋风 [老代汉化].nes",desc:"快打旋风汉化",img:"快打旋风汉化.png"},
    {name:"快打旋风.nes",desc:"快打旋风",img:"快打旋风.png"},

    {name:"炸弹人1.nes",desc:"炸弹人1.nes",img:"炸弹人1.png"},
    {name:"炸弹人2.nes",desc:"炸弹人2.nes",img:"炸弹人2.png"},

    {name:"魔鬼总动员.nes",desc:"魔鬼总动员",img:"魔鬼总动员.png"},

    {name:"兔宝宝历险记.nes",desc:"兔宝宝历险记.nes",img:"兔宝宝历险记.png"},

    {name:"215_热血新纪录.nes",desc:"热血新纪录",img:"热血新纪录.png"},
    {name:"热血物语[AIR汉化].nes",desc:"热血物语",img:"热血物语.png"},
    {name:"热血篮球(v0.9)[AXI&AHE汉化].nes",desc:"热血篮球",img:"热血篮球.png"},

    {name:"荒野大镖客.nes",desc:"荒野大镖客",img:"荒野大镖客.png"},
    {name:"火箭车.nes",desc:"火箭车",img:"火箭车.png"},
    {name:"绿色兵团.nes",desc:"绿色兵团",img:"绿色兵团.png"},
    {name:"西游记.nes",desc:"西游记",img:"西游记.png"},

    {name:"冒险岛.nes",desc:"冒险岛",img:"冒险岛.png"},
    {name:"冒险岛2.nes",desc:"冒险岛2",img:"冒险岛2.png"},
    {name:"冒险岛3.nes",desc:"冒险岛3",img:"冒险岛3.png"},
    {name:"冒险岛4.nes",desc:"冒险岛4",img:"冒险岛4.png"},

    {name:"洛克人.nes",desc:"洛克人",img:"洛克人.png"},
    {name:"洛克人2[NeoX汉化].nes",desc:"洛克人2",img:"洛克人2.png"},
    {name:"洛克人3 - Dr.Wily的末日 [MS汉化].nes",desc:"洛克人3",img:"洛克人3.png"},
    {name:"洛克人4-新的野心[MS汉化].nes",desc:"洛克人4",img:"洛克人4.png"},
    {name:"洛克人5-布鲁斯的圈套[MS汉化].nes",desc:"洛克人5",img:"洛克人5.png"},
    {name:"洛克人6-史上最长的战斗[MS汉化].nes",desc:"洛克人6",img:"洛克人6.png"},

    {name:"魂斗罗1 (U)30S.nes",desc:"魂斗罗",img:"魂斗罗.png"},
    {name:"魂斗罗2 (U)30S.nes",desc:"超级魂斗罗",img:"超级魂斗罗.png"},

    {name:"忍者神龟.nes",desc:"忍者神龟",img:"忍者神龟.png"},
    {name:"忍者神龟2.nes",desc:"忍者神龟2",img:"忍者神龟2.png"},
    {name:"忍者神龟快打.nes",desc:"忍者神龟快打",img:"忍者神龟快打.png"},
    {name:"忍者神龟格斗.nes",desc:"忍者神龟格斗",img:"忍者神龟格斗.png"},

    // {name:"忍者神龟3.nes",desc:"忍者神龟3",img:"default.jpg"},

    {name:"双截龙2.nes",desc:"双截龙2",img:"双截龙2.png"},
    {name:"双截龙3.nes",desc:"双截龙3",img:"双截龙3.png"},
    {name:"1943.nes",desc:"1943",img:"1943.png"},

    {name:"泡泡龙.nes",desc:"泡泡龙",img:"泡泡龙.png"},

    // {name:"AV麻将.nes",desc:"AV麻将",img:"default.jpg"},
    // {name:"F1赛车.nes",desc:"F1赛车",img:"default.jpg"},
    {name:"FC原人.nes",desc:"FC原人",img:"FC原人.png"},

    // {name:"七宝奇谋.nes",desc:"七宝奇谋",img:"default.jpg"},
    {name:"三只小猪.nes",desc:"三只小猪",img:"三只小猪.png"},

    {name:"中东战争.nes",desc:"中东战争",img:"中东战争.png"},
    {name:"中华大仙.nes",desc:"中华大仙",img:"中华大仙.png"},
    {name:"中国象棋.nes",desc:"中国象棋",img:"中国象棋.png"},
    {name:"人间兵器.nes",desc:"人间兵器",img:"人间兵器.png"},
    {name:"企鹅梦物语.nes",desc:"企鹅梦物语",img:"企鹅梦物语.png"},
    {name:"俄罗斯方块.nes",desc:"俄罗斯方块",img:"俄罗斯方块.png"},
    {name:"充气狗.nes",desc:"充气狗",img:"充气狗.png"},
    {name:"兵蜂.nes",desc:"兵蜂",img:"兵蜂.png"},
    {name:"功夫.nes",desc:"功夫",img:"功夫.png"},
    // {name:"加纳战机(无限命+无限雷 hack by 小粽子).nes",desc:"加纳战机无限命无限雷",img:"default.jpg"},
    // {name:"加纳战机.nes",desc:"加纳战机",img:"default.jpg"},
    // {name:"南京企鹅.nes",desc:"南京企鹅",img:"default.jpg"},


    {name:"吃豆.nes",desc:"吃豆",img:"吃豆.png"},
    {name:"唐老鸭梦冒险.nes",desc:"唐老鸭梦冒险",img:"唐老鸭梦冒险.png"},
    {name:"唐老鸭梦冒险2.nes",desc:"唐老鸭梦冒险2",img:"唐老鸭梦冒险2.png"},
    {name:"嘉蒂外传.nes",desc:"嘉蒂外传",img:"嘉蒂外传.png"},
    {name:"地底探险.nes",desc:"地底探险",img:"地底探险.png"},

    {name:"外星战将.nes",desc:"外星战将",img:"外星战将.png"},
    // {name:"小蜜蜂.nes",desc:"小蜜蜂",img:"default.jpg"},
    {name:"彩虹岛.nes",desc:"彩虹岛",img:"彩虹岛.png"},
    {name:"影子传说.nes",desc:"影子传说",img:"影子传说.png"},
    {name:"影子传说（无敌版）by nianxu.nes",desc:"影子传说无敌版",img:"影子传说无敌版.png"},
    {name:"忍者蛙.nes",desc:"忍者蛙",img:"忍者蛙.png"},
    {name:"忍者龙剑传1.nes",desc:"忍者龙剑传1",img:"忍者龙剑传1.png"},
    {name:"忍者龙剑传2.nes",desc:"忍者龙剑传2",img:"忍者龙剑传2.png"},
    {name:"忍者龙剑传3.nes",desc:"忍者龙剑传3",img:"忍者龙剑传3.png"},
    {name:"快乐猫.nes",desc:"快乐猫",img:"快乐猫.png"},

    {name:"怪鸭历险.nes",desc:"怪鸭历险",img:"怪鸭历险.png"},
    {name:"恶魔城.nes",desc:"恶魔城",img:"恶魔城.png"},
    {name:"拆屋工.nes",desc:"拆屋工",img:"拆屋工.png"},
    // {name:"摩托车大赛.nes",desc:"摩托车大赛",img:"default.jpg"},
    {name:"敲冰块.nes",desc:"敲冰块",img:"敲冰块.png"},
    {name:"最终任务.nes",desc:"最终任务",img:"最终任务.png"},
    {name:"未来战士.nes",desc:"未来战士",img:"未来战士.png"},

    // {name:"柯拉米世界2.nes",desc:"柯拉米世界2",img:"default.jpg"},
    // {name:"桌球.nes",desc:"桌球",img:"default.jpg"},
    // {name:"沙罗曼蛇.nes",desc:"沙罗曼蛇",img:"default.jpg"},

    {name:"激龟快打.nes",desc:"激龟快打",img:"激龟快打.png"},
    {name:"火之鸟.nes",desc:"火之鸟",img:"火之鸟.png"},
    // {name:"炸弹人.nes",desc:"炸弹人",img:"default.jpg"},
    {name:"热血格斗传说.nes",desc:"热血格斗传说",img:"热血格斗传说.png"},
    // {name:"王子外传.nes",desc:"王子外传",img:"default.jpg"},
    {name:"究极虎.nes",desc:"究极虎",img:"究极虎.png"},
    {name:"脱狱.nes",desc:"脱狱",img:"脱狱.png"},
    {name:"脱狱2.nes",desc:"脱狱2",img:"脱狱2.png"},
    {name:"菲力猫.nes",desc:"菲力猫",img:"菲力猫.png"},
    // {name:"蝙蝠侠.nes",desc:"蝙蝠侠",img:"default.jpg"},
    {name:"赤影战士.nes",desc:"赤影战士",img:"赤影战士.png"},
    // {name:"赤色要塞.nes",desc:"赤色要塞",img:"default.jpg"},

    {name:"越野机车.nes",desc:"越野机车",img:"越野机车.png"},
    {name:"踢王.nes",desc:"踢王",img:"踢王.png"},
    {name:"顽皮狗.nes",desc:"顽皮狗",img:"顽皮狗.png"},
    {name:"马戏团.nes",desc:"马戏团",img:"马戏团.png"},

    {name:"鳄鱼先生.nes",desc:"鳄鱼先生",img:"鳄鱼先生.png"},
    {name:"鸟人战队.nes",desc:"鸟人战队",img:"鸟人战队.png"},
    {name:"筋肉人[Madcell汉化].nes",desc:"筋肉人",img:"筋肉人.png"},
    {name:"救火英雄[cslrxyz汉化].nes",desc:"救火英雄",img:"救火英雄.png"},
    {name:"神风超级玛丽.nes",desc:"神风超级玛丽.nes",img:"神风超级玛丽.png"},
    {name:"神风超级玛丽2.nes",desc:"神风超级玛丽2.nes",img:"神风超级玛丽2.png"},
    {name:"超级玛丽2无敌版.nes",desc:"超级玛丽2无敌版.nes",img:"超级玛丽2无敌版.png"},
    {name:"超级玛丽3无敌狐狸.nes",desc:"超级玛丽3无敌狐狸.nes",img:"超级玛丽3无敌狐狸.png"},
    {name:"超级玛丽原始人.nes",desc:"超级玛丽原始人.nes",img:"超级玛丽原始人.png"},
    {name:"超级玛丽无敌版.nes",desc:"超级玛丽无敌版.nes",img:"超级玛丽无敌版.png"},
    {name:"超级玛丽的使命.nes",desc:"超级玛丽的使命.nes",img:"超级玛丽的使命.png"},
    {name:"超级玛丽维特罗克.nes",desc:"超级玛丽维特罗克.nes",img:"超级玛丽维特罗克.png"},
    {name:"拳皇VS饿狼传说.nes",desc:"拳皇VS饿狼传说.nes",img:"拳皇VS饿狼传说.png"},

    {name:"12人街霸.nes",desc:"12人街霸",img:"12人街霸.png"},
    {name:"20人街霸.nes",desc:"20人街霸",img:"20人街霸.png"},
    {name:"街霸5人.nes",desc:"街霸5人.nes",img:"街霸5人.png"},
]