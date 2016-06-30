var logger = require('pomelo-logger').getLogger(__filename);
var pomelo = require('pomelo');
var utils = require('./utils');
var consts = require('./consts');
var dao = require('../dao/dao');
var fs = require('fs');

var loadData = module.exports;

loadData.loadAll = function(){
    cache();
    loadAllcfg(function(f){
        for(var i in f){
            pomelo.app.set(i,f[i]);
        }
        logger.info('策划配置表已经加载完成');
    });
    loadUser(function(users){
        pomelo.app.set(consts.cache.USER,users);
        logger.info('用户表已经加载完成');
    });
    loadRole(function(roles){
        pomelo.app.set(consts.cache.ROLE,roles);
        logger.info('角色表已经加载完成');
    });
    loadFriend(function(friend,friends){
        pomelo.app.set(consts.cache.FRIEND,friend);
        pomelo.app.set(consts.cache.FRIENDS,friends);
        logger.info('好友表已经加载完成');
    });
    loadMessage(function(message,messages){
        pomelo.app.set(consts.cache.MESSAGE,message);
        pomelo.app.set(consts.cache.MESSAGES,messages);
        logger.info('消息表已经加载完成');
    });
    loadInform(function(inform,informs){
        pomelo.app.set(consts.cache.INFORM,inform);
        pomelo.app.set(consts.cache.INFORMS,informs);
        logger.info('邮件表已经加载完成');
    });
};

loadData.load = function(tab){
    if(tab==consts.table.USER){
        loadUser(function(users){
            pomelo.app.set(consts.cache.USER,users);
            logger.info('用户表已经单独加载完成');
        });
        return;
    }else if(tab==consts.table.ROLE){
        loadRole(function(roles){
            pomelo.app.set(consts.cache.ROLE,roles);
            logger.info('角色表已经单独加载完成');
        });
        return;
    }else if(tab==consts.table.FRIEND){
        loadFriend(function(friend,friends){
            pomelo.app.set(consts.cache.FRIEND,friend);
            pomelo.app.set(consts.cache.FRIENDS,friends);
            logger.info('好友表已经单独加载完成');
        });
        return;
    }else if(tab==consts.table.MESSAGE){
        loadMessage(function(message,messages){
            pomelo.app.set(consts.cache.MESSAGE,message);
            pomelo.app.set(consts.cache.MESSAGES,messages);
            logger.info('消息表已经单独加载完成');
        });
        return;
    }else if(tab==consts.table.INFORM){
        loadInform(function(inform,informs){
            pomelo.app.set(consts.cache.INFORM,inform);
            pomelo.app.set(consts.cache.INFORMS,informs);
            logger.info('邮件表已经单独加载完成');
        });
        return;
    }else{
        logger.error('无此表，请确认：'+tab);
    }
};

var cache = function(){
    pomelo.app.set(consts.cache.ONLINE,{});
    pomelo.app.set(consts.cache.TOKEN,{});
    pomelo.app.set(consts.cache.ROLEINFO,{});
    pomelo.app.set(consts.job.BULLETIN,{});
    logger.info('缓存数据已经预加载完成');
};

var loadAllcfg = function(cb){
    var files = fs.readdirSync(consts.sys.TEMP_PATH);
    var f = {};
    for (var i = 0; i < files.length; i++) {
        var key = files[i].substring(0, files[i].lastIndexOf('.'));
        var ext = files[i].substring(files[i].lastIndexOf('.')+1);
        if(ext=='json'){
            var value = fs.readFileSync(consts.sys.TEMP_PATH + '\\' + files[i], {encoding: 'utf8', flag: 'r'});
            value = JSON.parse(value);
            var nv = {};
            for(var j = 0; j < value.length; j++){
                nv[value[j].id] = value[j];
            }
            f[key] = nv;
        }
    }
    f[consts.schema.INITBAG] = loadInitbag('initBag.json');
    utils.invokeCallback(cb,f);
};

var loadInitbag = function(filename){
    var initbag = fs.readFileSync(consts.sys.TEMP_PATH + '\\' + filename, {encoding: 'utf8', flag: 'r'});
    initbag = JSON.parse(initbag);
    var bag = {material:{},stone:[],item:{},pet:[]};
    for(var i in initbag){
        var ini = initbag[i];
        if(consts.preid.MATERIAL==ini.type){
            if(!bag.material[ini.id]){
                bag.material[ini.id] = {type:ini.id,protected:0,num:0};
            }
            bag.material[ini.id].num = bag.material[ini.id].num+parseInt(ini.num);
        }else if(consts.preid.MAGICSTONE==ini.type){
            for(var j = 0; j < ini.num; j++){
                var stone = utils.clone(consts.stone);
                stone.type = ini.id;
                stone.isequip = 1;
                bag.stone.push(stone);
            }
        }else if(consts.preid.ITEM==ini.type){
            if(!bag.item[ini.id]){
                bag.item[ini.id] = {type:ini.id,protected:0,isequip:0,num:0};
            }
            bag.item[ini.id].num = bag.item[ini.id].num+parseInt(ini.num);
        }else if(consts.preid.PET==ini.type){
            for(var j = 0; j < ini.num; j++){
                var pet = utils.clone(consts.pet);
                pet.type = ini.id;
                pet.dispatch = 1;
                bag.pet.push(pet);
            }
        }
    }
    return bag;
};

var loadcfg = function(tab){
    var files = fs.readdirSync(consts.sys.TEMP_PATH);
    for (var i = 0; i < files.length; i++) {
        var key = files[i].substring(0, files[i].lastIndexOf('.'));
        if(key==tab){
            var ext = files[i].substring(files[i].lastIndexOf('.')+1);
            if(ext=='json'){
                var value = fs.readFileSync(consts.sys.TEMP_PATH + '\\' + files[i], {encoding: 'utf8', flag: 'r'});
                value = JSON.parse(value);
                var nv = {};
                for(var j = 0; j < value.length; j++){
                    nv[value[j].id] = value[j];
                }
                pomelo.app.set(tab, nv);
                logger.info('策划配置表'+tab+'已经单独加载完成');
                return;
            }
        }
    }
};

loadData.reloadcfg = function(tab){
    if(tab==consts.schema.INITBAG){
        loadInitbag('initBag.json');
    }else{
        loadcfg(tab);
    }
};

var loadRole = function(cb){
    dao.selectAll(consts.table.ROLE,function(res){
        if(res&&res.length>0){
            var roles = {};
            for(var i = 0; i < res.length; i++){
                var role = res[i];
                for(var k in role){
                    if(k=='id'||k=='userId'){
                        continue;
                    }
                    role[k] = JSON.parse(role[k]);
                }
                roles[role.id] = role;
                role.status = consts.crud.R;
            }
            utils.invokeCallback(cb,roles);
        }else{
            utils.invokeCallback(cb,{});
        }
    });
};
var loadUser = function(cb){
    dao.selectAll(consts.table.USER,function(res){
        if(res&&res.length>0){
            var users = {};
            for(var i = 0; i < res.length; i++){
                var user = res[i];
                user.status = consts.crud.R;
                var key = user.username+'&'+user.type+'&'+user.channelId;
                users[key] = user;
            }
            utils.invokeCallback(cb,users);
        }else{
            utils.invokeCallback(cb,{});
        }
    });
};

var loadFriend = function(cb){
    dao.selectAll(consts.table.FRIEND,function(res){
        if(res==null){
            utils.invokeCallback(cb,{},{});
        }else{
            var friend = {},friends = {};
            for(var i = 0; i < res.length; i++){
                var f = res[i];
                f.status = consts.crud.R;
                friend[f.id] = f;
                var tmp1 = {},tmp2 = {};
                if(friends[f.role1]){
                    tmp1 = friends[f.role1];
                }
                tmp1[f.role2] = f;
                friends[f.role1] = tmp1;
                if(friends[f.role2]){
                    tmp2 = friends[f.role2];
                }
                tmp2[f.role1] = f;
                friends[f.role2] = tmp2;
            }
            utils.invokeCallback(cb,friend,friends);
        }
    });
};

var loadMessage = function(cb){
    dao.selectAll(consts.table.MESSAGE,function(res){
        if(res&&res.length>0){
            var message = {}, messages = {};
            for(var i = 0; i < res.length; i++){
                var msg = res[i];
                msg.status = consts.crud.R;//数据默认是未修改未创建未删除的
                message[msg.id] = msg;
                var tt = msg.sender+'&'+msg.receiver;
                var t = msg.receiver+'&'+msg.sender;
                var key = tt || t;
                var tmp1 = {},tmp2 = {};
                if(messages[msg.sender]){
                    tmp1 = messages[msg.sender];
                    if(!tmp1[msg.receiver]){
                        tmp1[msg.receiver] = [];
                    }
                }else{
                    tmp1[msg.receiver] = [];
                }
                tmp1[msg.receiver].push(msg);
                messages[msg.sender] = tmp1;
                if(messages[msg.receiver]){
                    tmp2 = messages[msg.receiver];
                    if(!tmp2[msg.sender]){
                        tmp2[msg.sender] = [];
                    }
                }else{
                    tmp2[msg.sender] = [];
                }
                tmp2[msg.sender].push(msg);
                messages[msg.receiver] = tmp2;
            }
            utils.invokeCallback(cb,message,messages);
        }else{
            utils.invokeCallback(cb,{},{});
        }
    });
};

var loadInform = function(cb){
    dao.selectAll(consts.table.INFORM,function(res){
        if(res&&res.length>0){
            var inform = {}, informs = {};
            for(var i = 0; i < res.length; i++){
                var inf = res[i];
                inf.inform = JSON.parse(inf.inform);
                if(inf.attach){
                    inf.attach = JSON.parse(inf.attach);
                }
                inf.status = consts.crud.R;//数据默认是未修改未创建未删除的
                inform[inf.id] = inf;
                var tmp1 = {};
                if(informs[inf.receiver]){
                    tmp1 = informs[inf.receiver];
                }
                tmp1[inf.id] = inf;
                informs[inf.receiver] = tmp1;
            }
            utils.invokeCallback(cb,inform,informs);
        }else{
            utils.invokeCallback(cb,{},{});
        }
    });
};
