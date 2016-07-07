var logger = require('pomelo-logger').getLogger(__filename);
var consts = require('../../../util/consts');
var utils = require('../../../util/utils');
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
        case 'updatefightcfg':
            self.updatefightcfg(msg,session,next);
            return;
        default:
            next(null,{
                msg:route,
                code:consts.code.E_CHECK,
                data:null
            });
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
        self.app.rpc.user.dataRemote.getRole('1',rid,function(role){
            var fightcfg = role.fightcfg;
            var res = role.res;
            //战术台校验开始
            var colors = [];
            for(var i = 0; i < stone.length; i++){
                var stoneId = stone[i];
                if(!stoneId){
                    continue;
                }
                var color = res.stone[stoneId].type.substr(0,2);
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
            }
            for(var i = 0; i < fightcfg.stone.length; i++){
                var stoneId = fightcfg.stone[i];
                if(!stoneId){
                    continue;
                }
                res.stone[stoneId].isequip = 0;
                fightcfg.stone[i] = 0;
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
            }
            //战术台校验结束
            for(var i = 0; i < stone.length; i++){
                var stoneId = stone[i];
                if(stoneId){
                    if(res.stone[stoneId]){
                        res.stone[stoneId].isequip = 1;
                    }else{
                        next(null,{
                            msg:route,
                            code:consts.code.E_DATA,
                            data:null
                        });
                        return;
                    }
                }
                fightcfg.stone[i] = stoneId;
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
            role.res = res;
            role.fightcfg = fightcfg;
            self.app.rpc.user.dataRemote.updateRole('1',role,function(){
                next(null,{
                    msg:route,
                    code:consts.code.SUCCESS,
                    data:null
                });
            });
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
var createFight = function(role,self,cb){
    self.app.rpc.user.dataRemote.getRoleInfo('1',role.id,function(roleInfo){
        if(!roleInfo){
            utils.invokeCallback(cb,null);
            return;
        }
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
                utils.invokeCallback(cb,null);
                return;
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
        utils.invokeCallback(cb,roleInfo);
        return;
    });
};

/**
 * 普通关卡战斗开始
 * */
handler.startFight = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
        var levelId = msg.levelId;
        var level = utils.getItem(consts.schema.LEVEL,levelId,self,null);
        if(level){
            var role = self.app.rpc.user.dataRemote.getRole(rid,null);
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
            //暂且按照原来的实现，此处未用到
           /*createFight(role,self,function(roleInfo){
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
                self.app.rpc.user.dataRemote.saveRoleInfo('1',roleInfo,function(){
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
                });
           });*/
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
 * 普通关卡战斗结算
 * */
handler.fightResult = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
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
    var rid = session.get(consts.sys.RID);
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
    var rid = session.get(consts.sys.RID);
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
    var rid = session.get(consts.sys.RID);
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
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
    }else{
        next(null,{
            msg:route,
            code:consts.code.E_CHECK,
            data:null
        });
    }
};
