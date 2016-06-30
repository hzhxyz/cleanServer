module.exports = {
    sys: {
        PATH: '../',
        TEMP_PATH: '../shared/config/template',
        CHANNEL:'sysch',
        ONLINES:'onlines',
        DBCLIENT:'dbclient',
        RID:'rid',
        CS:'channelService',
        BCS:'backendSessionService',
        SS:'sessionService',
        AS:'activities',
        DS:'dataService',
        GCS:'globalChannelService',
        PT:1
    },
    schema:{
        ATTRRESTRAIN:'attrrestrain',
        BUFF:'buff',
        CHAPTER:'chapter',
        GRADE:'grade',
        INITBAG:'initBag',
        INITROLE:'roleCfg',
        ITEM:'item',
        LEVEL:'level',
        MAP:'map',
        LEVELMONSTERDATA:'levelMonsterData',
        MAGICADVANCE:'magicAdvance',
        MAGICRISESTAR:'magicRiseStar',
        MAGICSTONE:'magicStone',
        MAGICSTONECOMPOUND:'magicStoneCompound',
        MAGICSTONEINFO:'magicStoneInfo',
        MAGICSTONERESOLVE:'magicStoneResolve',
        MATERIAL:'material',
        PET:'pet',
        PETADVANCE:'petAdvance',
        PETLVUP:'petlvup',
        RUNE:'rune',
        RUNECOMPOUND:'runeCompound',
        ROLELV:'roleLV',
        FRIRENDMETAL:'friendmetal',
        ITEMEFFECT:'itemEffect',
        MALL:'mall',
        ACTIVITY:'activity',
        DETAIL:'detail',
        TYPE1:'type1',
        TYPE2:'type2',
        TYPE3:'type3',
        TYPE4:'type4',
        BULLETIN:'bulletin'
    },
    preid:{
        PASS:'0006',
        MATERIAL:'1040',
        ITEM:'1060',
        MAGICSTONE:'1050',
        PET:'0030',
        RUNE:'1041'
    },
    time:{
        minute:60000,
        hour:3600000,
        second:1000,
        date:86400000,
        passtime:60000
    },
    events:{
        CLOSED:'closed',
        CLOSE:'onClose',
        FIGHTRESULT:'onFightResult',
        PLUNDERRESULT:'onPlunderResult',
        PASSNUM:'onPassnum',
        NOTICE:'onNotice',
        MSG:'onMsg',
        REQFRIEND:'onReqFriend',
        RESFRIEND:'onResFriend',
        NEWEMAIL:'onNewEmail',
        REQPASS:'onReqPass',
        RESPASS:'onResPass',
        PLUNDER:'onPlunder'
    },
    emailType:{
        FIGHTRESULT:'fightResult',
        PLUNDERRESULT:'plunderResult',
        PLUNDER:'plunder',
        REQFRIEND:'reqFriend',
        RESFRIEND:'resFriend',
        NOTICE:'notice',
        MSG:'msg',
        REQPASS:'reqPass',
        RESPASS:'resPass'
    },
    code:{
        SUCCESS:0,
        E_CHECK:1,//参数未通过校验
        E_HAS:2,//数据已经存在
        E_NOTHAS:3,//数据不存在
        E_DB:4,//数据库操作出错
        E_DATA:5,//参数或者根据参数获取的数据错误
        E_SERVER:6,//服务器错误
        B_FAIL:10//业务逻辑失败
    },
    cache:{
        //----------------------以下为缓存数据库数据到内存
        USER:'userData',
        ROLE:'roleData',
        FRIEND:'friendData',
        FRIENDS:'friendsData',
        MESSAGE:'messageData',
        MESSAGES:'messagesData',
        INFORM:'informData',
        INFORMS:'informsData',
        //----------------------以上为缓存数据库数据到内存
        //----------------------以下为不写入到数据库的缓存
        ONLINE:'onlineData',//在线状态数据，主要指id，server，session
        TOKEN:'tokenData',//登录token
        ROLEINFO:'roleInfoData'//角色实时信息
    },
    table:{
        USER:'user',
        ROLE:'role',
        FRIEND:'friend',
        MESSAGE:'message',
        INFORM:'inform',
        ACTIVITY:'activity'
    },
    initrole:{
        role:{
            type:'',
            rolename:'',
            level:1,
            exp:0,
            gradeexp:0,
            grade:1,
            hp:45,
            atk:151,
            pet:1,
            gold:0
        },
        bag:{
            material:5,
            pet:5,
            stone:5,
            rune:5,
            item:5
        },
        pass:{
            dressnum:5,
            pnutime:null
        },
        level:{},
        plunder:{},
        fightcfg:{
            stone:[1,2,3,4,5],
            item:[0,0,0,0]
        },
        res:{
            material:{
                '0001':{}
            },
            item:{
                '0001':{}
            },
            stone:{
                'adsc':{}
            },
            pet:{
                'defr':{}
            }
        }
    },
    job:{
        BULLETIN:'bulletin'
    },
    crud:{
        R:0,//读取，默认值
        C:1,//创建，即插入
        U:2,//更新
        D:3//删除
    },
    stone:{
        type:'',
        star:0,
        starexp:0,
        rune:0,
        runeLevel:0,
        isequip:0,
        protected:0
    },
    pet:{
        type:'',
        level:1,
        dispatch:0,
        exp:0,
        rune:{
            rune1:0,
            level1:0,
            time1:null,
            rune2:0,
            level2:0,
            time2:null
        }
    },
    fightInfo:{
        levelType:null,
        level:null,
        special:null,
        specialMon:null,
        role:null,//角色等级数据
        fightcfg:null,//战术台详细信息
        matrix:null,//当前阵列
        list:null,//所有产生的魔法石列表,
        maxcombo:0,//最大连击数
        startTime:null,
        endTime:null
    },
    changePass:{
        FILL:3,
        CONSUME:1,
        RECOVER:2
    },
    ny:{
        N:'N',
        Y:'Y'
    }
};
