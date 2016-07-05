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

handler.on = function(msg,session,next){
    var route = msg.msg;
    var self = this;
    switch(route){
        case 'compoundStone':
            self.compoundStone(msg, session, next);
            return;
        case 'alchemyStone':
            self.alchemyStone(msg, session, next);
            return;
        case 'advancedStone':
            self.advancedStone(msg, session, next);
            return;
        case 'runeStone':
            self.runeStone(msg, session, next);
            return;
        case 'resolveStone':
            self.resolveStone(msg, session, next);
            return;
        case 'feedPet':
            self.feedPet(msg, session, next);
            return;
        case 'advancedPet':
            self.advancedPet(msg, session, next);
            return;
        case 'runePet':
            self.runePet(msg, session, next);
            return;
        case 'discard':
            self.discard(msg, session, next);
            return;
        case 'free':
            self.free(msg, session, next);
            return;
        case 'dispatch':
            self.dispatch(msg, session, next);
            return;
        case 'useItemOutcfg':
            self.useItemOutcfg(msg, session, next);
            return;
        case 'useItemIncfg':
            self.useItemIncfg(msg, session, next);
            return;
        case 'addAttachs':
            self.addAttachs(msg, session, next);
            return;
        case 'getRes':
            self.getRes(msg, session, next);
            return;
    }
};

/**
 * 合成魔法石
 * */
handler.compoundStone = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
        var formulaId = msg.formulaId;
        var activator = msg.activator;
        var formula = utils.getItem(consts.schema.MAGICSTONECOMPOUND,formulaId,self,null);
        if(formula){
            self.app.rpc.user.dataRemote.getRole('1',rid,function(role){
                var pro = parseInt(formula.pro);
                if(activator){
                    var material = utils.getItem(consts.schema.MATERIAL,activator,self,null);
                    if(material&&role.res.material[activator]&&role.res.material[activator].num>0){
                        pro = pro+parseInt(material.addPro);
                        role.res.material[activator].num = role.res.material[activator].num-1;
                        if(role.res.material[activator].num==0){
                            delete role.res.material[activator];
                        }
                    }
                }
                pro = pro/100;
                if(formula.grade>role.role.grade){
                    next(null,{
                        msg:route,
                        code:consts.code.E_DATA,
                        data:null
                    });
                    return;
                }else{
                    for(var i = 1; i < 6; i++){
                        var f = formula['good'+i];
                        var num = formula['num'+i];
                        var res = '';
                        if(consts.preid.MATERIAL == f.substr(0,4)){
                            res = 'material';
                        }else if(consts.preid.ITEM == f.substr(0,4)){
                            res = 'item';
                        }else if(consts.preid.MAGICSTONE == f.substr(0,4)){
                            res = 'stone';
                        }else if(consts.preid.PET == f.substr(0,4)){
                            res = 'pet';
                        }else{
                            next(null,{
                                msg:route,
                                code:consts.code.E_DATA,
                                data:null
                            });
                            return;
                        }
                        var r = role.res[res];
                        if(!r[f.substr(4)]||r[f.substr(4)].num<num){
                            next(null, {
                                msg: route,
                                code: consts.code.E_DATA,
                                data: null
                            });
                            return;
                        }else{
                            r[f.substr(4)].num = r[f.substr(4)].num - num;
                            if(r[f.substr(4)].num==0){
                                delete r[f.substr(4)];
                            }
                            role.res[res] = r;
                        }
                    }
                    var rand = Math.random();
                    var success = consts.code.SUCCESS;
                    if(rand>pro){//失败
                        success = consts.code.B_FAIL;
                    }else{
                        var stone = utils.clone(consts.stone);
                        stone.type = formula.id;
                        role.res.stone.push(stone);
                    }
                    self.app.rpc.user.dataRemote.updateRole('1',role,function(res){
                        next(null,{
                            msg:route,
                            code:res==consts.code.SUCCESS?success:res,
                            data:null
                        });
                    });
                }
            });
        }else{
            next(null,{
                msg:route,
                code:consts.code.E_DATA,
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
 * 魔法石炼金
 * */
handler.alchemyStone = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
        var stoneId = msg.stoneId;
        var data = msg.data;
        self.app.rpc.user.dataRemote.getRole('1',rid,function(role){
            var stone = role.res.stone[stoneId-1];
            if(stone){
                var exp = stone.starexp;
                var star = stone.star;
                var material = utils.getTemplate(consts.schema.MATERIAL,self,null);
                var pet = utils.getTemplate(consts.schema.PET,self,null);
                for(var i = 0; i < data.material.length; i++){//校验素材是否足够
                    var type = data.material[i].type;
                    var num = data.material[i].num;
                    if(!role.res.material[type]||role.res.material[type].num<num){
                        next(null,{
                            msg:route,
                            code:consts.code.E_DATA,
                            data:null
                        });
                        return;
                    }else{
                        role.res.material[type].num = role.res.material[type].num - num;
                        if(role.res.material[type].num==0){
                            delete role.res.material[type];
                        }
                        exp = exp+parseInt(material[type].exp)*num;
                    }
                }
                for(var i = 0; i < data.pet.length; i++){//校验宠物是否存在，宠物是否派遣
                    var index = data.pet[i].id-1;
                    if(!role.res.pet[index]||role.res.pet[index].dispatch==1){
                        next(null,{
                            msg:route,
                            code:consts.code.E_DATA,
                            data:null
                        });
                        return;
                    }else{
                        var type = role.res.pet[index].type;
                        exp = exp + parseInt(pet[type].exp);
                        role.res.pet = role.res.pet.splice(index,1);
                    }
                }
                var formula = utils.getItem(consts.schema.MAGICRISESTAR,stone.type,self,null);
                for(var i = star+1; i < 6; i++){
                    var nextexp = parseInt(formula['star'+i]);
                    if(exp>=nextexp){
                        exp = exp - nextexp;
                        star = i;
                    }else{
                        break;
                    }
                }
                stone.star = star;
                stone.starexp = exp;
                role.res.stone[stoneId-1] = stone;
                self.app.rpc.user.dataRemote.updateRole('1',role,function(res){
                    if(res==consts.code.SUCCESS){
                        next(null,{
                            msg:route,
                            code:res,
                            data:null
                        });
                    }else{
                        next(null,{
                            msg:route,
                            code:res,
                            data:null
                        });
                    }
                });
            }else{
                next(null,{
                    msg:route,
                    code:consts.code.E_NOTHAS,
                    data:null
                });
            }
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
 * 魔法石进化
 * */
handler.advancedStone = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
        var formulaId = msg.formulaId;
        var stoneId = msg.stoneId;
        var activator = msg.activator;
        self.app.rpc.user.dataRemote.getRole('1',rid,function(role){
            var formula = utils.getItem(consts.schema.MAGICADVANCE,formulaId,self,null);
            var stone = role.res.stone[stoneId-1];
            if(stone&&formula&&stone.type==formula.formid&&role.role.grade>=formula.grade){
                var pro = parseInt(formula.pro);
                for(var i = 1; i < 5; i++){
                    var good = formula['good'+i];
                    var num = formula['n'+i];
                    if(good&&good!=0){
                        var res = '';
                        if(good.substr(0,4)==consts.preid.MATERIAL){
                            res = 'material';
                        }else if(good.substr(0,4)==consts.preid.ITEM){
                            res = 'item';
                        }else if(good.substr(0,4)==consts.preid.MAGICSTONE){
                            res = 'stone';
                        }else if(good.substr(0,4)==consts.preid.PET){
                            res = 'pet';
                        }else{
                            next(null,{
                                msg:route,
                                code:consts.code.E_DATA,
                                data:null
                            });
                            return;
                        }
                        var r = role.res[res];
                        if(r[good.substr(4,4)].num<num){
                            next(null,{
                                msg:route,
                                code:consts.code.E_DATA,
                                data:null
                            });
                            return;
                        }else{
                            r[good.substr(4,4)].num = r[good.substr(4,4)].num - num;
                            if(r[good.substr(4,4)].num==0){
                                delete r[good.substr(4,4)];
                            }
                            role.res[res] = r;
                        }
                    }
                }
                if(activator){
                    var material = utils.getItem(consts.schema.MATERIAL,activator,self,null);
                    if(material&&role.res.material[activator]&&role.res.material[activator].num>0){
                        pro = pro + parseInt(material.addPro);
                        role.res.material[activator].num = role.res.material[activator].num - 1;
                        if(role.res.material[activator].num==0){
                            delete role.res.material[activator];
                        }
                    }
                }
                var rand = Math.random();
                var success = consts.code.SUCCESS;
                if(pro/100<rand){
                    //失败
                    success = consts.code.B_FAIL;
                }else{
                    stone.type = formula.advanceid;
                    stone.star = 0;
                    stone.starexp = 0;
                    role.res.stone[stoneId-1] = stone;
                }
                self.app.rpc.user.dataRemote.updateRole('1',role,function(){
                    next(null,{
                        msg:route,
                        code:success,
                        data:null
                    });
                });
            }else{
                next(null,{
                    msg:route,
                    code:consts.code.E_DATA,
                    data:null
                });
            }
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
 * 魔法石高级炼金
 * */
handler.runeStone = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
        var stoneId = msg.stoneId;
        var data = msg.data;
        self.app.rpc.user.dataRemote.getRole('1',rid,function(role){
            var stone = role.res.stone[stoneId-1];
            var materials = utils.getTemplate(consts.schema.MATERIAL,self,null);
            if(stone){
                var rune = materials[data[0].type].attr;
                for(var i = 0; i < data.length; i++){
                    var m = data[i];
                    if(rune==materials[m.type].attr){
                        if(role.res.material[m.type].num>=m.num){
                            role.res.material[m.type].num = role.res.material[m.type].num - m.num;
                            if(role.res.material[m.type].num==0){
                                delete role.res.material[m.type];
                            }
                        }else{
                            next(null,{
                                msg:route,
                                code:consts.code.E_DATA,
                                data:null
                            });
                            return;
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
                if(rune!=0){
                    if(rune==stone.rune){
                        stone.runeLevel = stone.runeLevel+1;
                    }else{
                        stone.runeLevel = 1;
                        stone.rune = rune;
                    }
                    role.res.stone[stoneId-1] = stone;
                    self.app.rpc.user.dataRemote.updateRole('1',role,function(){
                        next(null,{
                            msg:route,
                            code:consts.code.SUCCESS,
                            data:null
                        });
                    });
                }else{
                    next(null,{
                        msg:route,
                        code:consts.code.E_DATA,
                        data:null
                    });
                }
            }else{
                next(null,{
                    msg:route,
                    code:consts.code.E_DATA,
                    data:null
                });
            }
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
 * 魔法石分解
 * */
handler.resolveStone = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
        var stoneId = msg.stoneId;
        self.app.rpc.user.dataRemote.getRole('1',rid,function(role){
            var stone = role.res.stone[stoneId-1];
            if(stone){
                if(stone.isequip==1){
                    next(null,{
                        msg:route,
                        code:consts.code.E_DATA,
                        data:null
                    });
                    return;
                }
                var formula = utils.getItem(consts.schema.MAGICSTONERESOLVE,stone.type,self,null);
                for(var i = 1; i < 6; i++){
                    var r = formula['r'+i];
                    var n = formula['n'+i];
                    var res = '';
                    if(r==0){
                        continue;
                    }
                    if(r.substr(0,4)==consts.preid.MAGICSTONE){
                        res = 'stone';
                    }else if(r.substr(0,4)==consts.preid.MATERIAL){
                        res = 'material';
                    }else if(r.substr(0,4)==consts.preid.ITEM){
                        res = 'item';
                    }else if(r.substr(0,4)==consts.preid.PET){
                        res = 'pet';
                    }else{
                        next(null,{
                            msg:route,
                            code:consts.code.E_DATA,
                            data:null
                        });
                        return;
                    }
                    var re = role.res[res];
                    if(re[r.substr(4,4)]){
                        re[r.substr(4,4)].num = re[r.substr(4,4)].num + n;
                    }else{
                        re[r.substr(4,4)] = {type:r.substr(4,4),num:n,protected:0};
                    }
                    role.res[res] = re;
                }
                role.res.stone = role.res.stone.splice(stoneId-1,1);
                self.app.rpc.user.dataRemote.updateRole('1',role,function(){
                    next(null,{
                        msg:route,
                        code:consts.code.SUCCESS,
                        data:null
                    });
                });
            }else{
                next(null,{
                    msg:route,
                    code:consts.code.E_NOTHAS,
                    data:null
                });
                return;
            }
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
 * 宠物喂养
 * */
handler.feedPet = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
        var petId = msg.petId;
        var data = msg.data;
        self.app.rpc.user.dataRemote.getRole('1',rid,function(role){
            var pet = role.res.pet[petId-1];
            var fightcfg = role.fightcfg;
            for(var i = 0; i< fightcfg.stone.length; i++){
                for(var j = 0; j < data.stone.length; j++){
                    if(fightcfg.stone[i]==data.stone[j]&&fightcfg.stone[i]!=0){
                        next(null,{
                            msg:route,
                            code:consts.code.E_DATA,
                            data:null
                        });
                        return;
                    }
                }
            }
            if(pet){
                var level = pet.level;
                var exp = pet.exp;
                var material = utils.getTemplate(consts.schema.MATERIAL,self,null);
                var stone = utils.getTemplate(consts.schema.MAGICSTONEINFO,self,null);
                for(var i = 0; i < data.material.length; i++){
                    var type = data.material[i].type;
                    var num = data.material[i].num;
                    if(role.res.material[type].num<num){
                        next(null,{
                            msg:route,
                            code:consts.code.E_DATA,
                            data:null
                        });
                        return;
                    }else{
                        role.res.material[type].num = role.res.material[type].num - num;
                        if(role.res.material[type].num==0){
                            delete role.res.material[type];
                        }
                        exp = exp+parseInt(material[type].exp)*num;
                    }
                }
                for(var i = 0; i < data.stone.length; i++){
                    var id = data.stone[i].id-1;
                    if(!role.res.stone[id]||role.res.stone[id].isequip==1){
                        next(null,{
                            msg:route,
                            code:consts.code.E_DATA,
                            data:null
                        });
                        return;
                    }else{
                        var sid = role.res.stone[id].type+''+role.res.stone[id].star;
                        exp = exp + parseInt(stone[sid].exp);
                        role.res.stone = role.res.stone.splice(id,1);
                    }
                }
                var formula = utils.getItem(consts.schema.PET,pet.type,self,null);
                var tid = formula.lvupID;
                var petlvup = utils.getTemplate(consts.schema.PETLVUP,self,null);
                var id = tid+''+level;
                while(exp>=petlvup[id].lvexp&&level<51){
                    exp = exp - petlvup[id].lvexp;
                    level = level+1;
                    id = tid+''+level;
                }
                pet.level = level;
                pet.exp = exp;
                role.res.pet[petId-1] = pet;
                self.app.rpc.user.dataRemote.updateRole('1',role,function(){
                    next(null,{
                        msg:route,
                        code:consts.code.SUCCESS,
                        data:null
                    });
                });
            }else{
                next(null,{
                    msg:route,
                    code:consts.code.E_NOTHAS,
                    data:null
                });
            }
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
 * 宠物进化
 * */
handler.advancedPet = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
        var petId = msg.petId;
        var formulaId = msg.formulaId;
        var activator = msg.activator;
        self.app.rpc.user.dataRemote.getRole('1',rid,function(role){
            var pet = role.res.pet[petId-1];
            if(pet){
                var formula = utils.getItem(consts.schema.PETADVANCE,formulaId,self,null);
                if(pet.type==formula.formid&&role.role.grade>=formula.grade&&pet.level>=formula.advanceLv){
                    var pro = parseInt(formula.pro);
                    for(var i = 1; i < 5; i++){
                        var good = formula['good'+i];
                        var n = formula['n'+i];
                        var res = '';
                        if(good==0){
                            continue;
                        }
                        if(good.substr(0,4)==consts.preid.MATERIAL){
                            res = 'material';
                        }else{
                            next(null,{
                                msg:route,
                                code:consts.code.E_DATA,
                                data:null
                            });
                            return;
                        }
                        var r = role.res[res];
                        if(r[good.substr(4,4)].num>=n){
                            r[good.substr(4,4)].num = r[good.substr(4,4)].num - n;
                            if(r[good.substr(4,4)].num==0){
                                delete r[good.substr(4,4)];
                            }
                            role.res[res] = r;
                        }else{
                            next(null,{
                                msg:route,
                                code:consts.code.E_DATA,
                                data:null
                            });
                            return;
                        }
                    }
                    if(activator){
                        var material = utils.getItem(consts.schema.MATERIAL,activator,self,null);
                        if(material&&role.res.material[activator]&&role.res.material[activator].num>0){
                            role.res.material[activator].num = role.res.material[activator].num - 1;
                            if(role.res.material[activator].num==0){
                                delete role.res.material[activator];
                            }
                            pro = pro+parseInt(material.addPro);
                        }
                    }
                    var rand = Math.random();
                    var success = consts.code.SUCCESS;
                    if(pro/100<rand){
                        success = consts.code.B_FAIL;
                    }else{
                        pet.type = formula.advanceid;
                        role.res.pet[petId-1] = pet;
                    }
                    self.app.rpc.user.dataRemote.updateRole('1',role,function(){
                        next(null,{
                            msg:route,
                            code:success,
                            data:null
                        });
                    });
                }else{
                    next(null,{
                        msg:route,
                        code:consts.code.E_DATA,
                        data:null
                    });
                    return;
                }
            }else{
                next(null,{
                    msg:route,
                    code:consts.code.E_NOTHAS,
                    data:null
                });
            }
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
 * 宠物高级养成
 * */
handler.runePet = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
        var petId = msg.petId;
        var data = msg.data;
        self.app.rpc.user.dataRemote.getRole('1',rid,function(role){
            var pet = role.res.pet[petId-1];
            var materials = utils.getTemplate(consts.schema.MATERIAL,self,null);
            if(pet){
                var rune = materials[data[0].type].attr;
                for(var i = 0; i < data.length; i++){
                    var m = data[i];
                    if(rune==materials[m.type].attr){
                        if(role.res.material[m.type].num>=m.num){
                            role.res.material[m.type].num = role.res.material[m.type].num - m.num;
                            if(role.res.material[m.type].num==0){
                                delete role.res.material[m.type];
                            }
                        }else{
                            next(null,{
                                msg:route,
                                code:consts.code.E_DATA,
                                data:null
                            });
                            return;
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
                if(rune!=0){
                    var r = pet.rune;
                    if(r.rune1==0){
                        r.rune1 = rune;
                        r.level1 = 1;
                    }else{
                        if(r.rune1==rune){
                            if(r.level1<5){
                                r.level1 = r.level1+1;
                            }else{}
                        }else{
                            if(r.rune2==0){
                                r.rune2 = rune;
                                r.level2 = 1;
                            }else if(r.rune2==rune){
                                if(r.level2<5){
                                    r.level2 = r.level2+1;
                                }else{}
                            }
                        }
                    }
                    pet.rune = r;
                    role.res.stone[petId-1] = pet;
                    self.app.rpc.user.dataRemote.updateRole('1',role,function(){
                        next(null,{
                            msg:route,
                            code:consts.code.SUCCESS,
                            data:null
                        });
                    });
                }else{
                    next(null,{
                        msg:route,
                        code:consts.code.E_DATA,
                        data:null
                    });
                }
            }else{
                next(null,{
                    msg:route,
                    code:consts.code.E_NOTHAS,
                    data:null
                });
            }
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
 * 丢弃仓库中的东西（不包括宠物）
 * */
handler.discard = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
        var res = msg.res;
        var type = msg.type;
        var id = msg.id;
        var index = id-1;
        self.app.rpc.user.dataRemote.getRole('1',rid,function(role){
            var r1 = role.res[res];
            var fightcfg = role.fightcfg;
            if(consts.preid.MATERIAL==res){
                delete r1[type];
                role.res[type] = r1;
            }else if(consts.preid.MAGICSTONE==res&&r1[index]&&r1[index].type==type){
                for(var i = 0; i < fightcfg.stone.length; i++){
                    var stone = fightcfg.stone[i];
                    if(stone==id){
                        next(null,{
                            msg:route,
                            code:consts.code.E_DATA,
                            data:null
                        });
                        return;
                    }
                }
                r1 = r1.splice(index,1);
                role.res[res] = r1;
            }else if(consts.preid.ITEM==res&&r1[type]){
                var num = r1[type].num;
                for(var i = 0; i < fightcfg.item.length; i++){
                    var item = fightcfg.item[i];
                    if(item==type){
                        num = num - 1;
                    }
                }
                r1[type].num = num;
                role.res[res] = r1;
            }else{
                next(null,{
                    msg:route,
                    code:consts.code.E_DATA,
                    data:null
                });
                return;
            }
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
 * 宠物放生
 * */
handler.free = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
        var petId = msg.petId;
        self.app.rpc.user.dataRemote.getRole('1',rid,function(role){
            var r = role.res.pet[petId-1];
            if(r){
                if(r.dispatch==1){
                    next(null,{
                        msg:route,
                        code:consts.code.E_DATA,
                        data:null
                    });
                    return;
                }
                role.res.pet = role.res.pet.splice(petId-1,1);
            }
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
 * 宠物派遣
 * */
handler.dispatch = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
        var petId = msg.petId;
        self.app.rpc.user.dataRemote.getRole('1',rid,function(role){
            var pet = role.res.pet;
            for(var i = 0; i < pet.length; i ++){
                pet[i].dispatch = 0;
            }
            pet[petId-1].dispatch = 1;
            role.res.pet = pet;
            role.role.pet = petId;
            self.app.rpc.user.dataRemote.updateRole(role,function(){
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
 * 战斗中使用战术台之外的道具
 * */
handler.useItemOutcfg = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
        var type = msg.type;
        var num = msg.num;
        self.app.rpc.user.dataRemote.getRole('1',rid,function(role){
            var item = role.res.item[type];
            if(item&&item.num>=num){
                item.num = item.num - num;
                if(item.num==0){
                    delete role.res.item[type];
                }else{
                    role.res.item[type] = item;
                }
                self.app.rpc.dataRemote.updateRole('1',role,function(){
                    next(null,{
                        msg:route,
                        code:consts.code.SUCCESS,
                        data:null
                    });
                });
            }else{
                next(null,{
                    msg:route,
                    code:consts.code.E_NOTHAS,
                    data:null
                });
            }
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
 * 战斗中使用战术台的道具
 * */
handler.useItemIncfg = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
        var pos = msg.pos-1;
        self.app.rpc.user.dataRemote.getRole('1',rid,function(role){
            var fightcfg = role.fightcfg;
            if(fightcfg.item.length>pos){
                fightcfg.item[pos] = 0;
                role.fightcfg = fightcfg;
                self.app.rpc.user.dataRemote.updateRole('1',role,function(){
                    next(null,{
                        msg:route,
                        code:consts.code.SUCCESS,
                        data:null
                    });
                });
            }else{
                next(null,{
                    msg:route,
                    code:consts.code.E_DATA,
                    data:null
                });
            }
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
 * 收取邮件中的附件
 * */
handler.addAttachs = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
        var informId = msg.informId;
        self.app.rpc.user.dataRemote.getInform('1',informId,rid,function(inform){
            self.app.rpc.user.dataRemote.getRole('1',rid,function(role){
                if(inform){
                    var attach = inform.attach;
                    if(attach&&inform.pick==consts.ny.N){
                        var bag = role.bag;
                        var tmp = {
                            item:utils.getLength(role.res.item),
                            material:utils.getLength(role.res.material),
                            stone:utils.getLength(role.res.stone),
                            pet:utils.getLength(role.res.pet)
                        };
                        for(var i = 0; i < attach.length; i++){
                            var r = attach[i];
                            var res = '';
                            if(r.res==consts.preid.ITEM){
                                if(!role.res.item[r.type]){
                                    tmp.item++;
                                }
                            }else if(r.res==consts.preid.MATERIAL){
                                if(!role.res.material[r.type]){
                                    tmp.material++;
                                }
                            }else if(r.res==consts.preid.MAGICSTONE){
                                tmp.stone += r.num;
                            }else if(r.res==consts.preid.PET){
                                tmp.pet += r.num;
                            }else{
                                next(null,{
                                    msg:route,
                                    code:consts.code.E_DATA,
                                    data:null
                                });
                                return;
                            }
                        }
                        if(bag.item*5>=tmp.item&&bag.stone>=tmp.stone&&bag.material*5>=tmp.material&&bag.pet*5>=tmp.pet){
                        }else{
                            next(null,{
                                msg:route,
                                code:consts.code.E_NOTHAS,
                                data:null
                            });
                            return;
                        }
                        for(var i = 0; i < attach.length; i++){
                            var r = attach[i];
                            if(consts.preid.ITEM==r.res){
                                var item = role.res.item;
                                if(item[r.type]){
                                    item[r.type].num = item[r.type].num+ r.num;
                                }else{
                                    item[r.type] = {type:r.type,num: r.num,protected:0,isequip:0};
                                }
                                role.res.item = item;
                            }else if(consts.preid.MATERIAL==r.res){
                                var material = role.res.material;
                                if(material[r.type]){
                                    material[r.type].num = material[r.type].num+ r.num;
                                }else{
                                    material[r.type] = {type:r.type,num: r.num,protected:0,isequip:0};
                                }
                                role.res.material = material;
                            }else if(consts.preid.MAGICSTONE==r.res){
                                for(var i = 0; i < r.num; i++){
                                    var stone = utils.clone(consts.stone);
                                    stone.type = r.type;
                                    role.res.stone.push(stone);
                                }
                            }else if(consts.preid.PET==r.res){
                                for(var i = 0; i < r.num; i++){
                                    var pet = utils.clone(consts.pet);
                                    pet.type = r.type;
                                    role.res.pet.push(pet);
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
                        inform.r = consts.ny.Y;
                        inform.pick = consts.ny.Y;
                        self.app.rpc.user.dataRemote.updateInform('1',inform,function(){});
                        self.app.rpc.user.dataRemote.updateRole('1',role,function(res){
                            next(null,{
                                msg:route,
                                code:consts.code.SUCCESS,
                                data:null
                            });
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
                        code:consts.code.E_NOTHAS,
                        data:null
                    });
                }
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
 * 获取仓库和宠物园的数据
 * */
handler.getRes = function(msg, session, next){
    var route = msg.msg;
    msg = msg.data;
    var self = this;
    var rid = session.get(consts.sys.RID);
    if(msg.check==0){
        self.app.rpc.user.dataRemote.getRole('1',rid,function(role){
            next(null,{
                msg:route,
                code:consts.code.SUCCESS,
                data:{res:role.res}
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
