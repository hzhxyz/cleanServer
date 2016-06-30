var logger = require('pomelo-logger').getLogger(__filename);
var pomelo = require('pomelo');
var utils = require('./utils');
var consts = require('./consts');
var dao = require('../dao/dao');

var loadData = module.exports;

loadData.persist = function(){
    persistRole();
    persistUser();
    persistFriend();
    persistInform();
    persistMessage();
};


var persistUser = function(cb){
    var users = pomelo.app.get(consts.cache.USER);
    if(users){
        for(var i in users){
            if(true){
                var user = utils.clone(users[i]);
                if(user.status==consts.crud.U){
                    dao.update(consts.table.USER,user,function(res){
                        if(res){
                            var key = res.username+'&'+res.type+'&'+res.channelId;
                            users[key].status = consts.crud.R;
                            logger.info('更新用户信息成功');
                        }else{
                            logger.error('更新用户信息失败：'+JSON.stringify(user));
                        }
                    });
                }else if(user.status==consts.crud.C){
                    dao.insert(consts.table.USER,user,function(res){
                        if(res){
                            var key = res.username+'&'+res.type+'&'+res.channelId;
                            users[key].status = consts.crud.R;
                            logger.info('插入用户信息成功');
                        }else{
                            logger.error('插入用户信息失败：'+JSON.stringify(user));
                        }
                    });
                }else if(user.status==consts.crud.D){
                    dao.delete(consts.table.USER,user.id,function(res){
                        if(res){
                            //TODO 此处用户缓存数据暂时无法更新，请删除user中数据时不要调用本接口
                            logger.info('删除用户信息成功');
                        }else{
                            logger.error('删除用户信息失败：'+JSON.stringify(user));
                        }
                    });
                }
            }
        }
    }
};

var persistRole = function(cb){
    var roles = pomelo.app.get(consts.cache.ROLE);
    if(roles){
        for(var i in roles){
            if(roles[i]){
                var role = utils.clone(roles[i]);
                for(var i in role){
                    if(i=='id'||i=='userId'){
                        continue;
                    }
                    role[i] = JSON.stringify(role[i]);
                }
                if(role.status==consts.crud.U){
                    dao.update(consts.table.ROLE,role,function(res){
                        if(res){
                            roles[res.id].status = consts.crud.R;
                            logger.info('更新角色信息成功');
                        }else{
                            logger.error('更新角色信息失败：'+JSON.stringify(role));
                        }
                    });
                }else if(role.status==consts.crud.C){
                    dao.insert(consts.table.ROLE,role,function(res){
                        if(res){
                            roles[res.id].status = consts.crud.R;
                            logger.info('插入角色信息成功');
                        }else{
                            logger.error('插入角色信息失败：'+JSON.stringify(role));
                        }
                    });
                }else if(role.status==consts.crud.D){
                    dao.delete(consts.table.ROLE,role.id,function(res){
                        if(res){
                            delete roles[res.id];
                            logger.info('删除角色信息成功');
                        }else{
                            logger.error('删除角色信息失败：'+JSON.stringify(role));
                        }
                    });
                }
            }
        }
    }
};

var persistFriend = function(cb){
    var friend = pomelo.app.get(consts.cache.FRIEND);
    for(var i in friend){
        if(true){
            var f = utils.clone(friend[i]);
            if(f.status==consts.crud.C){
                dao.insert(consts.table.FRIEND,f,function(res){
                    if(res){
                        friend[res.id].status = consts.crud.R;
                        logger.info('插入好友信息成功');
                    }else{
                        logger.error('插入好友信息失败：'+JSON.stringify(f));
                    }
                });
            }else if(f.status==consts.crud.U){
                dao.update(consts.table.FRIEND,f,function(res){
                    if(res){
                        friend[res.id].status = consts.crud.R;
                        logger.info('更新好友信息成功');
                    }else{
                        logger.error('更新好友信息失败：'+JSON.stringify(f));
                    }
                });
            }else if(f.status==consts.crud.D){
                dao.delete(consts.table.FRIEND, f.id,function(res){
                    if(res){//已经在业务层对friends进行了处理
                        delete friend[res.id];
                        logger.info('删除好友信息成功');
                    }else{
                        logger.error('删除好友信息失败：'+JSON.stringify(f));
                    }
                });
            }
        }
    }
};

var persistMessage = function(cb){
    var message = pomelo.app.get(consts.cache.MESSAGE);
    for(var i in message){
        if(true){
            var msg = utils.clone(message[i]);
            if(msg.status==consts.crud.C){
                dao.insert(consts.table.MESSAGE,msg,function(res){
                    if(res){
                        message[res.id].status = consts.crud.R;
                        logger.info('插入信息成功');
                    }else{
                        logger.error('插入信息失败：'+JSON.stringify(msg));
                    }
                });
            }else if(msg.status==consts.crud.U){
                dao.update(consts.table.MESSAGE,msg,function(res){
                    if(res){
                        message[res.id].status = consts.crud.R;
                        logger.info('更新信息成功');
                    }else{
                        logger.error('更新信息失败：'+JSON.stringify(msg));
                    }
                });
            }else if(msg.status==consts.crud.D){
                dao.delete(consts.table.MESSAGE, msg.id,function(res){
                    if(res){
                        delete message[res.id];
                        logger.info('删除信息成功');
                    }else{
                        logger.error('删除信息失败：'+JSON.stringify(msg));
                    }
                });
            }
        }
    }
};

var persistInform = function(cb){
    var inform = pomelo.app.get(consts.cache.INFORM);
    for(var i in inform){
        if(true){
            var inf = utils.clone(inform[i]);
            inf.inform = JSON.stringify(inf.inform);
            if(inf.attach){
                inf.attach = JSON.stringify(inf.attach);
            }
            if(inf.status==consts.crud.C){
                dao.insert(consts.table.INFORM,inf,function(res){
                    if(res){
                        inform[res.id].status = consts.crud.R;
                        logger.info('插入通知信息成功');
                    }else{
                        logger.error('插入通知信息失败：'+JSON.stringify(inf));
                    }
                });
            }else if(inf.status==consts.crud.U){
                dao.update(consts.table.INFORM,inf,function(res){
                    if(res){
                        inform[res.id].status = consts.crud.R;
                        logger.info('更新通知信息成功');
                    }else{
                        logger.error('更新通知信息失败：'+JSON.stringify(inf));
                    }
                });
            }else if(inf.status==consts.crud.D){
                dao.delete(consts.table.INFORM, inf.id,function(res){
                    if(res){
                        delete inform[res.id];
                        logger.info('删除通知信息成功');
                    }else{
                        logger.error('删除通知信息失败：'+JSON.stringify(inf));
                    }
                });
            }
        }
    }
};
