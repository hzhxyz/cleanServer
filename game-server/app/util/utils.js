var consts = require('./consts');
var fs = require('fs');
var utils = module.exports;

var MINUTE = '1';
var HOUR = '2';
var DAY = '3';
var WEEK = '4';
var MONTH = '5';

// control variable of func "myPrint"
var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
var isPrintFlag = false;
// var isPrintFlag = true;

/**
 * Check and invoke callback function
 */
utils.invokeCallback = function(cb) {
  if(!!cb && typeof cb === 'function') {
    cb.apply(null, Array.prototype.slice.call(arguments, 1));
  }
};

/**
 * clone an object
 */
utils.clone = function(origin) {
  if(!origin) {
    return;
  }

  var obj = {};
  for(var f in origin) {
    if(origin.hasOwnProperty(f)){
      obj[f] = origin[f];
    }
  }
  return obj;
};

utils.size = function(obj) {
  if(!obj) {
    return 0;
  }

  var size = 0;
  for(var f in obj) {
    if(obj.hasOwnProperty(f)) {
      size++;
    }
  }

  return size;
};

// print the file name and the line number ~ begin
function getStack(){
  var orig = Error.prepareStackTrace;
  Error.prepareStackTrace = function(_, stack) {
    return stack;
  };
  var err = new Error();
  Error.captureStackTrace(err, arguments.callee);
  var stack = err.stack;
  Error.prepareStackTrace = orig;
  return stack;
}

function getFileName(stack) {
  return stack[1].getFileName();
}

function getLineNumber(stack){
  return stack[1].getLineNumber();
}

utils.print = function (v, s) {
    if (v) {
        if (s) {
            if (typeof v == 'object') {
                for (var i in v) {
                    if (typeof v[i] == 'function') {
                        console.error('function:' + i);
                    } else {
                        console.error(i + ':' + JSON.stringify(v[i]));
                    }
                }
            } else {
                console.error(JSON.stringify(v));
            }
        }else{
            if (typeof v == 'object') {
                for (var i in v) {
                    if (typeof v[i] == 'function') {
                        console.error('function:' + i);
                    } else {
                        console.error(i + ':' + v[i]);
                    }
                }
            } else {
                console.error(v);
            }
        }
    } else {
        console.error(v);
    }
};
// print the file name and the line number ~ end

utils.formatDate = function(date, format){
    var self = this;
    if(date){
        date = new Date(date);
        var y = date.getFullYear();
        var M = date.getMonth()+1;
        var d = date.getDate();
        var H = date.getHours();
        var m = date.getMinutes();
        var s = date.getSeconds();
        M = self.left(M, 2);
        d = self.left(d, 2);
        H = self.left(H, 2);
        m = self.left(m, 2);
        s = self.left(s, 2);
        switch(format){
            case 'yyyy-MM-dd':
                return y+'-'+M+'-'+d;
            case 'yyyy-MM-dd HH:mm:ss':
                return y+'-'+M+'-'+d+' '+H+':'+m+':'+s;
            case 'HH:mm:ss':
                return H+':'+m+':'+s;
            default :
                return y+'-'+M+'-'+d+' '+H+':'+m+':'+s;
        }
    }else{
        return null;
    }
};

utils.left = function(num,length){
    var str = num.toString();
    var c = length - str.length;
    if(c){
        var tmp = '';
        for(var i = 0; i < c; i++){
            tmp += '0';
        }
        return tmp+str;
    }else{
        return str;
    }
};

utils.right = function(num,length){
    var str = num.toString();
    var c = length - str.length;
    if(c){
        var tmp = '';
        for(var i = 0; i < c; i++){
            tmp += '0';
        }
        return str+tmp;
    }else{
        return str;
    }
};

/**
 * 只能生成一些简单的cron，复杂cron需要自己写
 *
* date:第一次执行时间
* type:是否循环执行。0:否;1:每天;2:每周;3:每月
* times:如果是循环执行，循环的间隔，如果time是week，0-6(sun-sat)
* time:如果是循环执行，循环的间隔的单位，如minute或者hour
* */
utils.getCron = function(date,type,times,time){
    if(!date){
        return;
    }
    date = new Date(date);
    var M = date.getMonth()+1;
    var d = date.getDate();
    var H = date.getHours();
    var m = date.getMinutes();
    var s = date.getSeconds();
    var w = date.getDay();
    if(type){
        if(type==1) {//每天间隔times
            if (time == MINUTE) {
                return s + ' ' + m + '/' + times + ' ' + H + ' ' + d+'/1' + ' ' + M + ' ' + w;
            } else if (time == HOUR) {
                return s + ' ' + m + ' ' + H + '/' + times + ' ' + d+'/1' + ' ' + M + ' ' + w;
            }else{
                return s+' '+m+' '+H+' '+d+' '+M+' '+w;
            }
        }else if(type==2){//每周某天间隔times
            if (time == MINUTE) {
                return s + ' ' + m + '/' + times + ' ' + H + ' ' + d + ' ' + M + ' ' + w+'/1';
            } else if (time == HOUR) {
                return s + ' ' + m + ' ' + H + '/' + times + ' ' + d + ' ' + M + ' ' + w+'/1';
            }else if(time==DAY){
                return s + ' ' + m + ' ' + H + ' ' + d + '/' + times + ' ' + M + ' ' + w+'/1';
            }else{
                return s+' '+m+' '+H+' '+d+' '+M+' '+w;
            }
        }else{
            return s+' '+m+' '+H+' '+d+' '+M+' '+w;
        }
    }else{
        return s+' '+m+' '+H+' '+d+' '+M+' '+w;
    }
};

utils.uuid = function (len, radix) {
    var chars = CHARS, uuid = [], i;
    radix = radix || chars.length;

    if (len) {
        // Compact form
        for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random()*radix];
    } else {
        // rfc4122, version 4 form
        var r;

        // rfc4122 requires these characters
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';

        // Fill in random data.  At i==19 set the high bits of clock sequence as
        // per rfc4122, sec. 4.1.5
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | Math.random()*16;
                uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
            }
        }
    }

    return uuid.join('');
};

// A more performant, but slightly bulkier, RFC4122v4 solution.  We boost performance
// by minimizing calls to random()
utils.uuidFast = function() {
    var chars = CHARS, uuid = new Array(36), rnd=0, r;
    for (var i = 0; i < 36; i++) {
        if (i==8 || i==13 ||  i==18 || i==23) {
            uuid[i] = '-';
        } else if (i==14) {
            uuid[i] = '4';
        } else {
            if (rnd <= 0x02) rnd = 0x2000000 + (Math.random()*0x1000000)|0;
            r = rnd & 0xf;
            rnd = rnd >> 4;
            uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
        }
    }
    return uuid.join('');
};

// A more compact, but less performant, RFC4122v4 solution:
utils.uuidCompact = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};

utils.isBlank = function(str){
    if(typeof str == 'object'){
        var l = 0;
        for(var i in str){
            l++;
        }
        if(l>0){
            return false;
        }else{
            return true;
        }
    }else if(typeof str == 'array'){
        return str.length==0;
    }else{
        var reg = /\s*/;
        if(!str&&reg.test(str)){
            return true;
        }else{
            return false;
        }
    }
};


/**
 *  MD5 (Message-Digest Algorithm)
 *  http://www.webtoolkit.info/
 **/
utils.MD5 = function (string) {

    function RotateLeft(lValue, iShiftBits) {
        return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
    }

    function AddUnsigned(lX,lY) {
        var lX4,lY4,lX8,lY8,lResult;
        lX8 = (lX & 0x80000000);
        lY8 = (lY & 0x80000000);
        lX4 = (lX & 0x40000000);
        lY4 = (lY & 0x40000000);
        lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
        if (lX4 & lY4) {
            return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
        }
        if (lX4 | lY4) {
            if (lResult & 0x40000000) {
                return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
            } else {
                return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
            }
        } else {
            return (lResult ^ lX8 ^ lY8);
        }
    }

    function F(x,y,z) { return (x & y) | ((~x) & z); }
    function G(x,y,z) { return (x & z) | (y & (~z)); }
    function H(x,y,z) { return (x ^ y ^ z); }
    function I(x,y,z) { return (y ^ (x | (~z))); }

    function FF(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    };

    function GG(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    };

    function HH(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    };

    function II(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    };

    function ConvertToWordArray(string) {
        var lWordCount;
        var lMessageLength = string.length;
        var lNumberOfWords_temp1=lMessageLength + 8;
        var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
        var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
        var lWordArray=Array(lNumberOfWords-1);
        var lBytePosition = 0;
        var lByteCount = 0;
        while ( lByteCount < lMessageLength ) {
            lWordCount = (lByteCount-(lByteCount % 4))/4;
            lBytePosition = (lByteCount % 4)*8;
            lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount)<<lBytePosition));
            lByteCount++;
        }
        lWordCount = (lByteCount-(lByteCount % 4))/4;
        lBytePosition = (lByteCount % 4)*8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
        lWordArray[lNumberOfWords-2] = lMessageLength<<3;
        lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
        return lWordArray;
    };

    function WordToHex(lValue) {
        var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
        for (lCount = 0;lCount<=3;lCount++) {
            lByte = (lValue>>>(lCount*8)) & 255;
            WordToHexValue_temp = "0" + lByte.toString(16);
            WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
        }
        return WordToHexValue;
    };

    function Utf8Encode(string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    };

    var x=Array();
    var k,AA,BB,CC,DD,a,b,c,d;
    var S11=7, S12=12, S13=17, S14=22;
    var S21=5, S22=9 , S23=14, S24=20;
    var S31=4, S32=11, S33=16, S34=23;
    var S41=6, S42=10, S43=15, S44=21;

    string = Utf8Encode(string);

    x = ConvertToWordArray(string);

    a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

    for (k=0;k<x.length;k+=16) {
        AA=a; BB=b; CC=c; DD=d;
        a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
        d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
        c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
        b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
        a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
        d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
        c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
        b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
        a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
        d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
        c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
        b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
        a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
        d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
        c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
        b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
        a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
        d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
        c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
        b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
        a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
        d=GG(d,a,b,c,x[k+10],S22,0x2441453);
        c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
        b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
        a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
        d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
        c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
        b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
        a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
        d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
        c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
        b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
        a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
        d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
        c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
        b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
        a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
        d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
        c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
        b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
        a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
        d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
        c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
        b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
        a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
        d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
        c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
        b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
        a=II(a,b,c,d,x[k+0], S41,0xF4292244);
        d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
        c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
        b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
        a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
        d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
        c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
        b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
        a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
        d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
        c=II(c,d,a,b,x[k+6], S43,0xA3014314);
        b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
        a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
        d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
        c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
        b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
        a=AddUnsigned(a,AA);
        b=AddUnsigned(b,BB);
        c=AddUnsigned(c,CC);
        d=AddUnsigned(d,DD);
    }

    var temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);

    return temp.toLowerCase();
};

utils.timediff = function(subt,minu){
    var diff = new Date(minu).getTime()-new Date(subt).getTime();
    return diff;
};

utils.readTemplate = function(){
    var files = fs.readdirSync(consts.sys.TEMP_PATH);
    var f = {};
    for (var i = 0; i < files.length; i++) {
        var key = files[i].substring(0, files[i].lastIndexOf('.'));
        var value = fs.readFileSync(consts.sys.TEMP_PATH + '\\' + files[i], {encoding: 'utf8', flag: 'r'});
        value = JOSN.stringify(value);
        var nv = {};
        for(var j = 0; j < value.length; j++){
            nv[value[j].id] = value[j];
        }
        f[key] = nv;
    }
    return f;
};

utils.isNumeric = function(o){
    var reg = /^\d+$/gm;
    return reg.test(o);
};

utils.getLength = function(o){
    if(this.isBlank(o)){
        return 0;
    }
    if(o.length){
        return o.length;
    }else{
        if(typeof o == 'object'||typeof o == 'string'||typeof o== 'number'||typeof o == 'array'){
            return String.valueOf(o).length;
        }else{
            return 0;
        }
    }
};

utils.contain = function(o,container){
    if(typeof container=='string'){
        var index = container.indexOf(o);
        return index!=-1;
    }else if(typeof container == 'array'){
        for(var i in container){
            return arguments.callee(o,container[i]);
        }
    }else if(typeof container == 'object'){
        for(var i in container){
            if(i==o){
                return container[i];
            }else{
                return null;
            }
        }
    }
};

utils.getRand = function(){
    var rand = parseInt(Math.acos(Math.random())*180/Math.PI);
    return rand;
};
