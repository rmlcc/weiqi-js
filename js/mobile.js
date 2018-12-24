function mobile_init(){
    besogo.autoInit();
    client = 'MOBILE';
    document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[0].hidden = true;
    document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[5].hidden = true;
    document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[6].hidden = true;
    document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[7].hidden = true;
    document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[8].hidden = true;
    document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[9].hidden = true;
    document.body.childNodes[1].childNodes[1].childNodes[0].append(makeShowNameButton());
    document.body.childNodes[1].childNodes[1].childNodes[0].append(makeShowTreeButton());
    document.body.childNodes[1].childNodes[1].childNodes[0].append(makeSpeedRange());
    document.body.childNodes[1].childNodes[1].childNodes[0].append(makeSpeedLabel());
    document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[13];

    document.body.childNodes[1].childNodes[1].childNodes[1].childNodes[0].childNodes[0].hidden = true;
    document.body.childNodes[1].childNodes[1].childNodes[1].childNodes[0].childNodes[1].hidden = true;

    document.body.childNodes[1].childNodes[1].childNodes[2].childNodes[1].hidden = true;
    document.body.childNodes[1].childNodes[1].childNodes[2].childNodes[2].hidden = true;

    document.body.childNodes[1].childNodes[1].childNodes[3].hidden = true;
}

function makeShowNameButton() {
    var button = document.createElement('input');
    button.type = 'button';
    button.value = '显示提子数';
    button.title = 'Play';
    
    button.onclick = function() {
	if(button.value == '显示提子数'){
	    button.value = '隐藏提子数';
	    document.body.childNodes[1].childNodes[1].childNodes[1].childNodes[0].childNodes[0].hidden = false;
	    document.body.childNodes[1].childNodes[1].childNodes[1].childNodes[0].childNodes[1].hidden = false;
	}
	else if(button.value == '隐藏提子数'){
	    button.value = '显示提子数';
	    document.body.childNodes[1].childNodes[1].childNodes[1].childNodes[0].childNodes[0].hidden = true;
	    document.body.childNodes[1].childNodes[1].childNodes[1].childNodes[0].childNodes[1].hidden = true;
	}
    };
    return button;
}

function makeShowTreeButton() {
    var button = document.createElement('input');
    button.type = 'button';
    button.value = '显示变化图';
    button.title = 'Play';
    
    button.onclick = function() {
	if(button.value == '显示变化图'){
	    button.value = '隐藏变化图';
	    document.body.childNodes[1].childNodes[1].childNodes[3].hidden = false;
	}
	else if(button.value == '隐藏变化图'){
	    button.value = '显示变化图';
	    document.body.childNodes[1].childNodes[1].childNodes[3].hidden = true;
	}
    };
    return button;
}

function makeSpeedRange() {
    var range = document.createElement('input');
    range.type = 'range';
    range.value = 5;
    range.title = 'Audio speed';
    range.min = 0;
    range.max = 15;
    
    range.onchange = function() {
	spd = parseInt(range.value);
	document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[14].innerText = spd;
    };
    return range;
}

function makeSpeedLabel() {
    var label = document.createElement('label');
    label.innerText = '5';
    label.title = 'Label speed';
    return label;
}
