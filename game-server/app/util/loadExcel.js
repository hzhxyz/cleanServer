var logger = require('pomelo-logger').getLogger(__filename);
var pomelo = require('pomelo');
var utils = require('./utils');
var consts = require('./consts');
var fs = require('fs');

var loadExcel = module.exports;

loadExcel.loadAll = function(){
    var files = fs.readdirSync(consts.sys.TEMP_PATH);
    for(var i = 0; i < files.length; i++){
        var file = files[i];
        if(file.indexOf('json')!=-1){
            var str = fs.readFileSync(file,'utf-8');
            var json = JSON.parse(str);
            if(file.indexOf(consts.schema.ACTIVITY)!=-1){
                var activity = loadActivity(json);
                pomelo.app.set(consts.schema.ACTIVITY,activity);
            }else if(file.indexOf(consts.schema.BULLETIN)!=-1){
                var bulletin = loadBulletin(json);
                pomelo.app.set(consts.schema.BULLETIN,bulletin);
            }else if(file.indexOf(consts.schema.TYPE4)!=-1){
                var type4 = loadType4(json);
                pomelo.app.set(consts.schema.TYPE4,type4);
            }else{
                var obj = loadById(json);
                pomelo.app.set(file.substring(0,file.lastIndexOf('.')),obj);
            }
        }
    }
};

/*
 * 调整模板数据
 * */
var loadById = function(json){
    var obj = {};
    for(var i = 0; i < json.length; i++){
        var item = json[i];
        obj[item.id] = item;
    }
    return obj;
};

/*
* 调整活动数据
* */
var loadActivity = function(json){};

/*
* 调整神兽数据
* */
var loadType4 = function(json){
    var type4 = {};
    for(var i = 0; i < json.length; i++){
        var tmp = {},t = json[i];
        if(type4[t.mapid]){
            tmp = type4[t.mapid];
        }
        tmp[t.id] = t;
        type4[t.mapid] = tmp;
    }
    return type4;
};

/*
* 调整公告数据
* */
var loadBulletin = function(json){};
