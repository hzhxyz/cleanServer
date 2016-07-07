var utils = require('../../../util/utils');
var logger = require('pomelo-logger').getLogger(__filename);
var dao = require('../../../dao/dao.js');
module.exports = function(app) {
    return new Filter(app);
}

var Filter = function(app) {
    this.app = app;
};

Filter.prototype.before = function (msg, session, next) {
    var route = msg.msg;
    var data = msg.data;
    if(!data){
        data = {};
    }
    if(route == 'confirmRole'){
        var type = data.type;
        var rolename = data.rolename;
        if(utils.isNumeric(type)&&!utils.isBlank(rolename)){
            data.check = 0;
        }else{
            data.check = 1;
        }
    }else if(route=='init'){
        data.check = 0;
    }else if(route=='consumePass'){
        data.check = 0;
    }else if(route=='recoverPass'){
        data.check = 0;
    }else if(route=='fillPass'){
        data.check = 0;
    }else if(route=='increasePass'){
        data.check = 0;
    }else if(route=='claimPass'){
        data.check = 0;
    }else if(route=='resPass'){
        var informId = data.informId;
        var fid = data.fid;
        var agree = data.agree;
        if(!utils.isBlank(informId)&&!utils.isBlank(fid)&&utils.isNumeric(agree)){
            data.check = 0;
        }else{
            data.check = 1;
        }
    }else if(route=='getFriends'){
        data.check = 0;
    }else if(route=='addFriend'){
        var fid = data.fid;
        if(!utils.isBlank(fid)){
            data.check = 0;
        }else{
            data.check = 1;
        }
    }else if(route=='ensureFriend'){
        var fid = data.fid;
        var agree = data.agree;
        var informId = data.informId;
        if(!utils.isBlank(fid)&&utils.isNumeric(agree)&&!utils.isBlank(informId)){
            data.check = 0;
        }else{
            data.check = 1;
        }
    }else if(route=='deleteFriend'){
        var fid = data.fid;
        if(!utils.isBlank(fid)){
            data.check = 0;
        }else{
            data.check = 1;
        }
    }else if(route=='getFriendInfo'){
        var fid = data.fid;
        if(!utils.isBlank(fid)){
            data.check = 0;
        }else{
            data.check = 1;
        }
    }else if(route=='getUsers'){
        data.check = 0;
    }else if(route=='unlock'){
        var type = data.type;
        var num = data.num;
        if(utils.isNumeric(type)&&utils.isNumeric(num)){
            data.check = 0;
        }else{
            data.check = 1;
        }
    }else if(route=='sendMsg'){
        var fid = data.fid;
        var msg = data.msg;
        if(!utils.isBlank(fid)&&!utils.isBlank(msg)){
            data.check = 0;
        }else{
            data.check = 1;
        }
    }else if(route=='getEmails'){
        data.check = 0;
    }else if(route=='deleteEmail'){
        var informId = data.informId;
        if(!utils.isBlank(informId)){
            data.check = 0;
        }else{
            data.check = 1;
        }
    }else if(route=='getMsgs'){
        data.check = 0;
    }else if(route=='updateEmail'){
        var informId = data.informId;
        if(!utils.isBlank(informId)){
            data.check = 0;
        }else{
            data.check = 1;
        }
    }else if(route=='updateMsg'){
        var fid = data.fid;
        if(!utils.isBlank(fid)){
            data.check = 0;
        }else{
            data.check = 1;
        }
    }else if(route == 'compoundStone'){
        var formulaId = data.formulaId;
        var activator = data.activator;
        if(utils.isNumeric(formulaId)&&(utils.isNumeric(activator)||utils.isBlank(activator))){
            data.check = 0;
        }else{
            data.check = 1;
        }
    }else if(route == 'alchemyStone'){
        var stoneId = data.stoneId;
        var d = data.data;
        if(utils.isNumeric(stoneId)&&!(utils.isBlank(d.material)&&utils.isBlank(d.pet))){
            data.check = 0;
        }else{
            data.check = 1;
        }
    }else if(route == 'advancedStone'){
        var formulaId = data.formulaId;
        var stoneId = data.stoneId;
        var activator = data.activator;
        if(utils.isNumeric(formulaId)&&utils.isNumeric(stoneId)&&utils.isNumeric(activator)){
            data.check = 0;
        }else{
            data.check = 1;
        }
    }else if(route == 'runeStone'){
        var stoneId = data.stoneId;
        var d = data.data;
        if(utils.isNumeric(stoneId)&&!utils.isBlank(d)&&d.length==5){
            data.check = 0;
        }else{
            data.check = 1;
        }
    }else if(route == 'resolveStone'){
        var stoneId = data.stoneId;
        if(utils.isNumeric(stoneId)){
            data.check = 0;
        }else{
            data.check = 1;
        }
    }else if(route == 'feedPet'){
        var petId = data.petId;
        var d = data.data;
        if(utils.isNumeric(petId)&&!(utils.isBlank(d.material)&&utils.isBlank(d.stone))){
            data.check = 0;
        }else{
            data.check = 1;
        }
    }else if(route == 'advancedPet'){
        var formulaId = data.formulaId;
        var activator = data.activator;
        if(utils.isNumeric(formulaId)&&(utils.isNumeric(activator)||utils.isBlank(activator))){
            data.check = 0;
        }else{
            data.check = 1;
        }
    }else if(route == 'runePet'){
        var petId = data.petId;
        var d = data.data;
        if(utils.isNumeric(petId)&&!utils.isBlank(d)&&d.length==5){
            data.check = 0;
        }else{
            data.check = 1;
        }
    }else if(route == 'discard'){
        var res = data.res;
        var type = data.type;
        var id = data.id;
        if(utils.isNumeric(res)&&utils.isNumeric(type)&&utils.isNumeric(id)){
            data.check = 0;
        }else{
            data.check = 1;
        }
    }else if(route == 'free'){
        var petId = data.petId;
        if(utils.isNumeric(petId)){
            data.check = 0;
        }else{
            data.check = 1;
        }
    }else if(route == 'dispatch'){
        var petId = data.petId;
        if(utils.isNumeric(petId)){
            data.check = 0;
        }else{
            data.check = 1;
        }
    }else if(route == 'useItemOutcfg'){
        var type = data.type;
        var num = data.num;
        if(utils.isNumeric(type)&&utils.isNumeric(num)){
            data.check = 0;
        }else{
            data.check = 1;
        }
    }else if(route == 'useItemIncfg'){
        var pos = data.pos;
        if(utils.isNumeric(pos)){
            data.check = 0;
        }else{
            data.check = 1;
        }
    }else if(route=='addAttachs'){
        var informId = data.informId;
        if(!utils.isBlank(informId)){
            data.check = 0;
        }else{
            data.check = 1;
        }
    }else if(route=='getRes'){
        data.check = 0;
    }else{
        data.check = 1;
    }
    msg.data = data;
    logger.info(utils.formatDate(Date.now())+' : 用户（uid为'+session.uid+',rid为'+session.get('rid')+'）的请求参数为：'+JSON.stringify(msg));
    next();
};

Filter.prototype.after = function (err, msg, session, resp, next){
    var re = utils.clone(resp);
    re.__route__ = msg.__route__;
    var now = Date.now();
    dao.insert('ldnm.act',{stime:utils.formatDate(now),act:JSON.stringify(msg),result:JSON.stringify(resp)},function(){});
    logger.info(utils.formatDate(now)+' : 用户（uid为'+session.uid+',rid为'+session.get('rid')+'）的请求返回值为：'+JSON.stringify(re));
    next();
};
