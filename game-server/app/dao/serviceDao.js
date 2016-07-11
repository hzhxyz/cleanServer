var logger = require('pomelo-logger').getLogger(__filename);
var pomelo = require('pomelo');
var utils = require('../util/utils');
var consts = require('../util/consts');

var dao = module.exports;

dao.update = function(tab,obj,cb){
    obj.status = undefined;
    var id = obj.id;
    obj.id = null;
    var set = '';
    var vs = [];
    for(var i in obj){
        if(obj[i]!=null){
            set+=','+i+'=?';
            vs.push(obj[i]);
        }
    }
    vs.push(id);
    var sql = 'update '+tab+' set '+set.substr(1)+' where id=?';
    pomelo.app.get(consts.sys.DBCLIENT).update(sql,vs,function(err,res){
        if(err){
            logger.error(err);
            cb(null);
        }else{
            obj.id = id;
            cb(obj);
        }
    });
};

dao.selectAll = function(tab,cb){
    var sql = 'select * from '+tab;
    pomelo.app.get(consts.sys.DBCLIENT).query(sql,null,function(err,res){
        if(err){
            logger.error(err);
            cb(null);
        }else{
            cb(res);
        }
    });
};

dao.selectSmon = function(rid,cb){
    var sql = 'select * from sdnm.smon where roleId=?';
    var args = [rid];
    pomelo.app.get(consts.sys.DBCLIENT).query(sql,args,function(err,res){
        if(err){
            logger.error(err);
            cb(null);
        }else{
            cb(res);
        }
    });
};

dao.insertSmon = function(obj,cb){
    var ks = [];
    var vs = [];
    var pvs = [];
    for (var i in obj) {
        if(obj[i]!=null){
            ks.push(i);
            vs.push(obj[i]);
            pvs.push('?');
        }
    }
    var sql = 'insert into sdnm.smon ('+ks.join(',')+') values ('+pvs.join(',')+')';
    pomelo.app.get(consts.sys.DBCLIENT).insert(sql, vs, function(err,res){
        if(err){
            logger.error(err);
            cb(null);
        }else{
            cb(obj);
        }
    });
};
