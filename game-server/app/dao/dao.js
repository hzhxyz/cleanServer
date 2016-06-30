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

dao.select = function(tab,id,cb){
    var sql = 'select * from '+tab+' where id=?';
    var args = [id];
    pomelo.app.get(consts.sys.DBCLIENT).query(sql,args,function(err,res){
        if(err){
            logger.error(err);
            cb(null);
        }else{
            cb(res);
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

dao.insert = function(tab,obj,cb){
    obj.status = undefined;
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
    var sql = 'insert into '+tab+' ('+ks.join(',')+') values ('+pvs.join(',')+')';
    pomelo.app.get(consts.sys.DBCLIENT).insert(sql, vs, function(err,res){
        if(err){
            logger.error(err);
            cb(null);
        }else{
            cb(obj);
        }
    });
};

dao.insertAll = function(tab,objs,cb){
    var ks = [];
    var vs = [];
    var pvs = '';
    var t = objs[0];
    for(var k in t){
        ks.push(k);
    }
    for(var i = 0; i < objs.length; i++){
        var obj = objs[i];
        var tmp = ',(';
        for(var k in obj){
            vs.push(obj[k]);
            tmp = tmp+'?,';
        }
        tmp = tmp.substring(0,tmp.lastIndexOf(','));
        tmp = tmp+')';
        pvs = pvs+tmp;
    }
    pvs = pvs.substr(1);
    var sql = 'insert into '+tab+' ('+ks.join(',')+') values '+pvs;
    pomelo.app.get(consts.sys.DBCLIENT).insert(sql,vs,function(err,res){
        if(err){
            logger.error(err);
            cb(null);
        }else{
            cb(res);
        }
    });
};

dao.insertOrUpdate = function(tab,obj,cb){
    obj.status = undefined;
    var ks = [];
    var vs = [];
    var pvs = [];
    var set = '';
    for (var i in obj) {
        if(obj[i]!=null){
            ks.push(i);
            vs.push(obj[i]);
            pvs.push('?');
            set+=','+i+'=?';
        }
    }
    vs = vs.concat(vs);
    var sql = 'insert into '+tab+' ('+ks.join(',')+') values ('+pvs.join(',')+') on duplicate key update '+set.substr(1);
    pomelo.app.get(consts.sys.DBCLIENT).insert(sql, vs, function(err,res){
        if(err){
            logger.error(err);
            cb(null);
        }else{
            cb(res);
        }
    });
};

dao.delete = function(tab,id,cb){
    var sql = 'delete from '+tab+' where id=?';
    var args = [id];
    pomelo.app.get(consts.sys.DBCLIENT).delete(sql,args,function(err,res){
        if(err){
            logger.error(err);
            cb(null);
        }else{
            cb({id:id});
        }
    });
};
