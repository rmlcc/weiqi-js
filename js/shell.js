// 初始化变量
var audio = null;
var gas = [];
var spd = 5;
var client = 'PC';
var tree = [];
var disable_tree_status = false;

// 合成按钮
function tts(str) {
    let text = str;
    
    // 调用语音合成接口
    // 参数含义请参考 https://ai.baidu.com/docs#/TTS-API/41ac79a6
    audio = btts({
        tex: text,
        tok: '24.265953991ae54850e98ee1efdf513310.2592000.1547974581.282335-15183500',
        spd: spd,
        pit: 5,
        vol: 15,
        per: 0
    }, {
        volume: 0.3,
        autoDestory: true,
        timeout: 10000,
        hidden: true,
        onInit: function (htmlAudioElement) {
	    
        },
        onSuccess: function(htmlAudioElement) {
            audio = htmlAudioElement;
	    audio.play();
	    audio.onended = function() {
		if(client == 'PC')
		    document.body.childNodes[1].childNodes[1].childNodes[2].childNodes[4].value = '全部播放';
		else if(client == 'MOBILE')
		    document.body.childNodes[1].childNodes[1].childNodes[2].childNodes[4].value = '全部播放';
		able_tree();
	    }
        },
        onError: function(text) {
	    console.log(text);
        },
        onTimeout: function () {
	    console.log('timeout');
        }
    });
}

function tts2(str) {
    let text = str;
    
    // 调用语音合成接口
    // 参数含义请参考 https://ai.baidu.com/docs#/TTS-API/41ac79a6
    audio = btts({
        tex: text,
        tok: '24.265953991ae54850e98ee1efdf513310.2592000.1547974581.282335-15183500',
        spd: spd,
        pit: 5,
        vol: 15,
        per: 0
    }, {
        volume: 0.3,
        autoDestory: true,
        timeout: 10000,
        hidden: true,
        onInit: function (htmlAudioElement) {
	    
        },
        onSuccess: function(htmlAudioElement) {
            audio = htmlAudioElement;
	    if(audio != null)
		audio.play();
	    audio.onended = function() {
		console.log('end');
		var div = document.body.childNodes[1];
		var button_next = div.childNodes[1].childNodes[0].childNodes[3].childNodes[0].childNodes[0];
		besogo.editor.nextNode(1);
		document.body.removeChild(audio);
		if(button_next.getAttribute("fill")=="black"){
		    if(client == 'PC')
			var str = document.body.childNodes[1].childNodes[1].childNodes[2].childNodes[7].innerText;
		    else if(client == 'MOBILE')
			var str = document.body.childNodes[1].childNodes[1].childNodes[2].childNodes[7].innerText;
		    tts2(str);  
		}
		else{
		    if(client == 'PC')
			var str = document.body.childNodes[1].childNodes[1].childNodes[2].childNodes[7].innerText;
		    else if(client == 'MOBILE')
			var str = document.body.childNodes[1].childNodes[1].childNodes[2].childNodes[7].innerText;
		    tts(str);
		}
	    }
        },
        onError: function(text) {
            console.log(text);
	    if(client == 'PC')
		document.body.childNodes[1].childNodes[1].childNodes[2].childNodes[4].value = '全部播放';
	    else if(client == 'MOBILE')
		document.body.childNodes[1].childNodes[1].childNodes[2].childNodes[4].value = '全部播放';
	    able_tree();
        },
        onTimeout: function () {
	    console.log('timeout');
	    if(client == 'PC')
		document.body.childNodes[1].childNodes[1].childNodes[2].childNodes[4].value = '全部播放';
	    else if(client == 'MOBILE')
		document.body.childNodes[1].childNodes[1].childNodes[2].childNodes[4].value = '全部播放';
	    able_tree();
        }
    });
}

// dom加载完毕回调
function ready(callback){
    var doc = document;
    if (doc.addEventListener) {
        doc.addEventListener('DOMContentLoaded', function() {
            callback();
        }, false);
    } else if (doc.attachEvent) {
        doc.attachEvent('onreadystatechange', function() {
            if (doc.readyState === 'complete') {
                callback();
            }
        });
    }
}

function makePlayButton() {
    var button = document.createElement('input');
    button.type = 'button';
    button.value = '播放';
    button.title = 'Play';
    
    button.onclick = function() {
	if(client == 'PC')
	    var str = document.body.childNodes[1].childNodes[1].childNodes[2].childNodes[7].innerText;
	else if(client == 'MOBILE')
	    var str = document.body.childNodes[1].childNodes[1].childNodes[2].childNodes[7].innerText;
	tts(str);
    };
    return button;
}

function makePlayAllButton() {
    var button = document.createElement('input');
    button.type = 'button';
    button.value = '全部播放';
    button.title = 'Play all';
    
    button.onclick = function() {
	if(button.value == '全部播放'){
	    button.value = '暂停';
	    disable_tree();
	    if(client == 'PC')
		var str = document.body.childNodes[1].childNodes[1].childNodes[2].childNodes[7].innerText;
	    else if(client == 'MOBILE')
		var str = document.body.childNodes[1].childNodes[1].childNodes[2].childNodes[7].innerText;
	    tts2(str);
	}
	else if(button.value == '暂停'){
	    button.value = '全部播放';
	    able_tree();
	    audio.pause();
	    document.body.removeChild(audio);
	    audio = null;
	}
	
    };
    return button;
}

function makeSaveTextButton() {
    var button = document.createElement('input');
    button.type = 'button';
    button.value = '导出文本';
    button.title = 'Save text';
    
    button.onclick = function() {
	var div = document.body.childNodes[1];
	var button_next = div.childNodes[1].childNodes[0].childNodes[3].childNodes[0].childNodes[0];
	var text = '';
	besogo.editor.prevNode(-1);
	while(button_next.getAttribute("fill")=="black"){
	    if(client == 'PC')
		var str = document.body.childNodes[1].childNodes[1].childNodes[2].childNodes[7].innerText;
	    else if(client == 'MOBILE')
		var str = document.body.childNodes[1].childNodes[1].childNodes[2].childNodes[7].innerText;
	    text += str + '\r\n';
	    besogo.editor.nextNode(1);
	}
	if(client == 'PC')
	    var str = document.body.childNodes[1].childNodes[1].childNodes[2].childNodes[7].innerText;
	else if(client == 'MOBILE')
	    var str = document.body.childNodes[1].childNodes[1].childNodes[2].childNodes[7].innerText;
	text += str + '\r\n';
	console.log(text);
	saveFile('export.txt',text);
    };
    return button;
}

function disable_tree(){
    document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[0].disabled = true;
    document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[1].disabled = true;
    document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[2].disabled = true;
    document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[3].disabled = true;
    document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[4].disabled = true;
    document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[5].disabled = true;
    document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[6].disabled = true;
    document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[7].disabled = true;

    disable_tree_status = true;
}

function able_tree(){
    document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[0].disabled = false;
    document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[1].disabled = false;
    document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[2].disabled = false;
    document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[3].disabled = false;
    document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[4].disabled = false;
    document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[5].disabled = false;
    document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[6].disabled = false;
    document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[7].disabled = false;

    disable_tree_status = false;
}

function sendComment(str){
    if(besogo.editor.getCurrent().comment.length > 0)
	str += besogo.editor.getCurrent().comment;
    besogo.editor.getCurrent().comment = str;
    if(client == 'PC')
	document.body.childNodes[1].childNodes[1].childNodes[2].childNodes[7].innerText = str;
    else if(client == 'MOBILE')
	document.body.childNodes[1].childNodes[1].childNodes[2].childNodes[7].innerText = str;
}

function updataComment(){
    var sizeX = besogo.editor.getCurrent().getSize().x;
    var sizeY = besogo.editor.getCurrent().getSize().y;
    var button_next = besogo.editor.nextNode;
    var button_prev = besogo.editor.prevNode;
    var button_sibling = besogo.editor.nextSibling;
    var x,y;
    while(besogo.editor.getCurrent().children.length > 0){
	updataComment_1();
	if(besogo.editor.getCurrent().getSiblings().length > 1){
	    button_sibling(1);
	    for(var i=1;i<besogo.editor.getCurrent().getSiblings().length;i++){
		var node_id = besogo.editor.getCurrent().moveNumber;
		updataComment_1()
		button_next(1);
		updataComment();
		while(node_id < besogo.editor.getCurrent().moveNumber)
		    button_prev(1);
		button_sibling(1);
	    }
	}
	button_next(1);
    }
    try{
	x = besogo.editor.getCurrent().move.x;
	y = besogo.editor.getCurrent().move.y;
    }catch(err){
	console.log(err);
    }
    updataComment_1();
}

function updataComment_1(){
    var str;
    try{
	var x = besogo.editor.getCurrent().move.x;
	var y = besogo.editor.getCurrent().move.y;
    }catch(err){
	console.log(err);
	return;
    }
    if(besogo.editor.getCurrent().comment.length > 0){
	str = besogo.editor.getCurrent().comment;
	var p1 = str.substr(0,str.search("坐标"));
	var p2 = str.substr(str.search("气数"));
	var str1 = "坐标(";
	var a1 = "ABCDEFGHJKLMNOPQRST"
	var a2 = "一二三四五六七八九"
    
	if(besogo.editor.getCoordStyle() == "numeric"){
	    str1 += x + "，" + y + ")，";
	}
	else if(besogo.editor.getCoordStyle() == "western"){
	    str1 += a1[x-1] + "，" + (20-y) + ")，";
	}
	else if(besogo.editor.getCoordStyle() == "eastern"){
	    var b1 = Math.floor(y/10);
	    var b2 = y%10;
	    var b3 = ((b1==1)?"十":"") + ((a2[b2-1]==undefined)?"":a2[b2-1]);
	    str1 += x + "，" + b3 + ")，";
	}
	else{
	    str1 += a1[x-1] + "，" + (20-y) + ")，";
	}
	str = p1 + str1 + p2;
	besogo.editor.getCurrent().comment = str;
	if(client == 'PC')
	    document.body.childNodes[1].childNodes[1].childNodes[2].childNodes[7].innerText = str;
	else if(client == 'MOBILE')
	    document.body.childNodes[1].childNodes[1].childNodes[2].childNodes[7].innerText = str;
    }
}

function sendMsg(x,y){
    var color = besogo.editor.getCurrent().getStone(x,y);
    try{
	var str = "第" + besogo.editor.getCurrent().navTreeIcon.childNodes[1].innerHTML + "手，";
	if(client == 'MOBILE'){
	    document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[15].max = parseInt(besogo.editor.getCurrent().navTreeIcon.childNodes[1].innerHTML);
	    document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[15].value = parseInt(besogo.editor.getCurrent().navTreeIcon.childNodes[1].innerHTML);
	}
    }catch(err){
	console.log(err);
	return;
    }
    str += (color==1)?"白子，":"黑子，";
    str += "坐标(";
    var a1 = "ABCDEFGHJKLMNOPQRST"
    var a2 = "一二三四五六七八九"
    
    if(besogo.editor.getCoordStyle() == "numeric"){
	str += x + "，" + y + ")，";
    }
    else if(besogo.editor.getCoordStyle() == "western"){
	str += a1[x-1] + "，" + (20-y) + ")，";
    }
    else if(besogo.editor.getCoordStyle() == "eastern"){
	var b1 = Math.floor(y/10);
	var b2 = y%10;
	var b3 = ((b1==1)?"十":"") + ((a2[b2-1]==undefined)?"":a2[b2-1]);
	str += x + "，" + b3 + ")，";
    }
    else{
	str += a1[x-1] + "，" + (20-y) + ")，";
    }
    var a = [];
    a.push({ x: x, y: y });
    gas = [];
    getGas(x-1,y,color,a);
    getGas(x+1,y,color,a);
    getGas(x,y-1,color,a);
    getGas(x,y+1,color,a);
    str += "气数" + gas.length + ';';
    sendComment(str);
}

function getGas(x, y, color, pending) {
    var i;
    var sizeX = besogo.editor.getCurrent().getSize().x;
    var sizeY = besogo.editor.getCurrent().getSize().y;
    if (x < 1 || y < 1 || x > sizeX || y > sizeY) {
        return false;
    }
    
    if (!besogo.editor.getCurrent().getStone(x, y)) {
	for (i = 0; i < gas.length; i++) {
            if (gas[i].x === x && gas[i].y === y) {
		return false;
            }
	}
	gas.push({ x: x, y: y });
        return true;
    }

    if (besogo.editor.getCurrent().getStone(x, y) === color) {
	for (i = 0; i < pending.length; i++) {
            if (pending[i].x === x && pending[i].y === y) {
		return false;
            }
	}
	pending.push({ x: x, y: y });
	getGas(x - 1, y, color, pending);
        getGas(x + 1, y, color, pending);
        getGas(x, y - 1, color, pending);
        getGas(x, y + 1, color, pending);
    }
    return false;
}

function initComment(){
    var sizeX = besogo.editor.getCurrent().getSize().x;
    var sizeY = besogo.editor.getCurrent().getSize().y;
    var button_next = besogo.editor.nextNode;
    var button_prev = besogo.editor.prevNode;
    var button_sibling = besogo.editor.nextSibling;
    var x,y;
    while(besogo.editor.getCurrent().children.length > 0){
	try{
	    x = besogo.editor.getCurrent().move.x;
	    y = besogo.editor.getCurrent().move.y;
	}catch(err){
	    console.log(err);
	    button_next(1);
	    continue;
	}
	sendMsg(x,y);
	if(besogo.editor.getCurrent().getSiblings().length > 1){
	    button_sibling(1);
	    for(var i=1;i<besogo.editor.getCurrent().getSiblings().length;i++){
		var node_id = besogo.editor.getCurrent().moveNumber;
		sendMsg(x,y);
		button_next(1);
		initComment();
		while(node_id < besogo.editor.getCurrent().moveNumber)
		    button_prev(1);
		button_sibling(1);
	    }
	}
	button_next(1);
    }
    try{
	x = besogo.editor.getCurrent().move.x;
	y = besogo.editor.getCurrent().move.y;
    }catch(err){
	console.log(err);
    }
    sendMsg(x,y);
}

function saveFile(filename,data){
    var blob=new Blob([data],{type:"text/plain"});
    var url=window.URL.createObjectURL(blob);
    var link=document.createElement('a');
    link.href=url;
    link.setAttribute("download",filename);
    document.body.append(link);
    link.click();
    link.remove();
}
