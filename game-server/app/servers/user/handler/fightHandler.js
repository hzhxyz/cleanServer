var logger = require('pomelo-logger').getLogger(__filename);
var consts = require('../../../util/consts');
var utils = require('../../../util/utils');
var dataRemote = require('../remote/dataRemote');
module.exports = function(app) {
    return new Handler(app);
};
var Handler = function(app) {
    this.app = app;
};
var handler = Handler.prototype;
handler.on = function(msg, session, next){
    var route = msg.msg;
    var self = this;
    switch(route){
        case 'register':
            self.register(msg,session,next);
            return;
    }
};

/**
 * 更新战术台
 * */
handler.updatefightcfg = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = self.app.get(consts.sys.RID);
    if(msg.check==0){
        var fcfg = msg.fightcfg;
        var stone = fcfg.stone;
        var item = fcfg.item;
        var role = dataRemote.getRole(rid,null);
        var fightcfg = role.fightcfg;
        var res = role.res;
        //战术台校验开始
        var colors = [];
        for(var i = 0; i < stone.length; i++){
            var stoneIndex = stone[i]-1;
            if(stoneIndex<res.stone.length&&stoneIndex>-1){
                var color = res.stone[stoneIndex].type.substr(0,2);
                color = parseInt(color);
                if(colors[color]){
                    next(null,{
                        msg:route,
                        code:consts.code.E_DATA,
                        data:null
                    });
                    return;
                }else{
                    colors[color] = color;
                }
            }else{
                next(null,{
                    msg:route,
                    code:consts.code.E_DATA,
                    data:null
                });
                return;
            }
        }
        for(var i = 0; i < fightcfg.item.length; i++){
            var type = fightcfg.item[i];
            if(!type){
                continue;
            }
            if(!res.item[type]){
                res.item[type] = {type:type,num:0,isequip:0,protected:0};
            }
            fightcfg.item[i] = 0;
            res.item[type].num = res.item[type].num + 1;
            role.res = res;
        }
        //战术台校验结束
        for(var i = 0; i < stone.length; i++){
            var stoneId = stone[i];
            if(fightcfg.stone[i]!=0&&stoneId!=0){
                res.stone[fightcfg.stone[i]-1].isequip = 0;
                res.stone[stoneId-1].isequip = 1;
                fightcfg.stone[i] = stoneId;
                role.res = res;
            }else{
                next(null,{
                    msg:route,
                    code:consts.code.E_DATA,
                    data:null
                });
                return;
            }
        }
        for(var i = 0; i < item.length; i++){
            var type = item[i];
            if(!type){
                continue;
            }
            if(res.item[type]&&res.item[type].num>0){
                res.item[type].num = res.item[type].num -1;
                if(res.item[type].num==0){
                    res.item[type] = undefined;
                }
                role.res = res;
                fightcfg.item[i] = type;
            }else{
                next(null,{
                    msg:route,
                    code:consts.code.E_DATA,
                    data:null
                });
                return;
            }
        }
        role.fightcfg = fightcfg;
        dataRemote.updateRole(role,null);
        next(null,{
            msg:route,
            code:consts.code.SUCCESS,
            data:null
        });
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/**
 * 创建战斗数据
 * */
var createFight = function(role){
    var roleInfo = dataRemote.getRoleInfo(role.id,null);
    roleInfo.fight = utils.clone(consts.fightInfo);
    var fight = roleInfo.fight;
    fight.role = role.role;
    fight.startTime = Date.now();
    var stone = role.res.stone;
    var fightcfg = {
        stone:[0,0,0,0,0],
        item:[0,0,0,0]
    };
    for(var i = 0; i < role.fightcfg.stone.length; i++){
        var stoneIndex = role.fightcfg.stone[i]-1;
        if(stoneIndex>=stone.length){
            return null;
        }else{
            fightcfg.stone.push(stone[stoneIndex]);
        }
    }
    fightcfg.item = role.fightcfg.item;
    fight.fightcfg = fightcfg;
    var list = [],matrix = [];
    for(var i = 0; i < 300; i++){
        var index = utils.getRand()%5;
        var type = fightcfg.stone[index];
        list.push(type.type);
    }
    for(var y = 0; y < 7; y++){
        for(var x = 0; x < 6; x++){
            var index = x*6+y*7;
            var e = {x:x,y:y,type:list[index]};
            matrix.push(e);
        }
    }
    fight.list = list;
    fight.matrix = matrix;
    roleInfo.fight = fight;
    return roleInfo;
};

/**
 * 普通关卡战斗开始
 * */
handler.startFight = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = self.app.get(consts.sys.RID);
    if(msg.check==0){
        var levelId = msg.levelId;
        var level = dataRemote.getItem(consts.schema.LEVEL,levelId,null);
        if(level){
            var role = dataRemote.getRole(rid,null);
            for(var i = 0; i < role.fightcfg.stone.length;i++){
                if(!role.fightcfg.stone[i]){
                    next(null,{
                        msg:route,
                        code:consts.code.E_DATA,
                        data:null
                    });
                    return;
                }
            }
            var roleInfo = createFight(role);
            if(!roleInfo){
                next(null,{
                    msg:route,
                    code:consts.code.E_DATA,
                    data:null
                });
                return;
            }
            roleInfo.fight.levelType = 'common';
            roleInfo.fight.level = level;
            dataRemote.saveRoleInfo(roleInfo,null);
            next(null,{
                msg:route,
                code:consts.code.SUCCESS,
                data:{
                    special:roleInfo.fight.special,
                    specialMon:roleInfo.fight.specialMon,
                    fightcfg:role.fightcfg,
                    list:roleInfo.fight.list
                }
            });
        }else{
            next(null,{
                msg:route,
                code:consts.code.E_NOTHAS,
                data:null
            });
        }
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/**
 * 普通关卡战斗进行
 * */
handler.fightProcess = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = self.app.get(consts.sys.RID);
    if(msg.check==0){
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/**
 * 普通关卡战斗结算
 * TODO
 * */
handler.fightResult = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = self.app.get(consts.sys.RID);
    if(msg.check==0){
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/**
 * 开始掠夺
 * */
handler.startPlunder = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = self.app.get(consts.sys.RID);
    if(msg.check==0){
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/**
 * 掠夺结算
 * */
handler.plunderResult = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = self.app.get(consts.sys.RID);
    if(msg.check==0){
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/**
 * 特殊关卡战斗开始
 * */
handler.startsFight = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = self.app.get(consts.sys.RID);
    if(msg.check==0){
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};

/**
 * 特殊关卡战斗结算
 * */
handler.sfightResult = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = self.app.get(consts.sys.RID);
    if(msg.check==0){
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};
