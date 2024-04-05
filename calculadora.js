function switchTheme() {
    document.documentElement.setAttribute('data-theme', (document.documentElement.getAttribute('data-theme')==="dark")?'light':"dark");
}

function showToast(message){
    document.getElementById('toast').innerText = message;
    document.getElementById('toast').style.animation = "fade_in_and_out 2s"
    setTimeout(()=>document.getElementById('toast').style.animation = "", 2000);
}

const formatter = new Intl.NumberFormat('en-US');

function recalculateResult(){
    let expression = document.getElementById('inputs').innerHTML
        .replaceAll(",","")
        .replaceAll("×","*")
        .replaceAll(/e(?=[+-])/g,"*10**") //replace all e's with the equivalent *10^
        .replaceAll(/[^.0-9*÷+\-()%]/g,"")
        .replaceAll("÷","/")
    let pattern = /\d+(\.\d*)?%/g
    let sliding = 0
    let matches = [...expression.matchAll(pattern)];
    //replace all % with the equivalent /100
    matches.forEach((match) => {
        expression = expression.slice(0,match.index + sliding)
            + '('
            + match[0].slice(0,-1)
            + '/100)'
            + expression.slice(match.index+match[0].length + sliding)
        sliding += 5;
    });
    // console.log(expression)
    if (!/^\d+(\.\d*)?$/g.test(expression)&&(expression.match(/\(/g)||[]).length === (expression.match(/\)/g)||[]).length) {
        let result = Function("return " + expression)()
        if (!isFinite(result)) return clearResult();
        let number = result.toString().split(".")
        if (!number[0].includes("e")) number[0] = formatter.format(parseInt(number[0]));
        number = number.join(".")
        document.getElementById('result').innerText = number
            // (Math.log10(result)>20||Math.log10(result)<0) ? result : formatter.format(result);

    } else {
        clearResult();
    }
}

function clearResult(){
    document.getElementById('result').innerText = "";
}

function setSeparators(){
    let pattern = /\d+(\.\d*)?/g
    let expression = document.getElementById('inputs').innerHTML.replaceAll(',','');
    let matches = [...expression.matchAll(pattern)];
    let commas = 0
    let newCommas
    matches.forEach((match) => {
        let number = match[0].split(".")
        newCommas = Math.floor((number[0].length-1) / 3);
        number[0] = formatter.format(parseInt(number[0]))
        number = number.join(".")
        expression = expression.slice(0,match.index + commas) + number + expression.slice(match.index+match[0].length + commas)
        commas += newCommas
    });
    document.getElementById('inputs').innerHTML = expression
}

function pressNumber(n){
    setStyles()
    let expression = document.getElementById('inputs').innerHTML;
    if (expression.at(-1)==='%') return
    if (/^[\d.]$/g.test(expression.at(-1)) && [...expression.replaceAll(",","").matchAll(/[\d,]+(\.\d*)?/g)].at(-1)[0].replace(".","").length>=15) {
        return showToast("No es posible introducir más de 15 dígitos")
    }
    if (/\.\d+$/g.test(expression) && expression.match(/\.\d+$/g)[0].length>11){
        return showToast("No es posible introducir más de 10 dígitos después del separador decimal")
    }
    document.getElementById('inputs').innerHTML = document.getElementById('inputs').innerHTML + n;
    setSeparators();
    recalculateResult();
}

function pressOperator(operator){
    setStyles()
    let expression = document.getElementById('inputs').innerHTML;
    if (expression.length===0) return
    let pattern = /​<span[^<]+>[^<]+<\/span>$/g
    if (!pattern.test(expression)){
        document.getElementById('inputs').innerHTML = expression + '&ZeroWidthSpace;<span class="operator_char">' + operator + '</span>'
        clearResult();
    } else {
        document.getElementById('inputs').innerHTML = expression.replace(pattern,'&ZeroWidthSpace;<span class="operator_char">' + operator + '</span>');
    }
}

function pressBrackets(){
    setStyles()
    let expression = document.getElementById('inputs').innerHTML;
    let openingBrackets = (expression.match(/\(/g)||[]).length
    let closingBrackets = (expression.match(/\)/g)||[]).length
    if (expression.at(-1)==='('||openingBrackets === closingBrackets){
        if (/^[\d.%]$/g.test(expression.at(-1))) pressOperator("&times;")
        document.getElementById('inputs').innerHTML = document.getElementById('inputs').innerHTML + '(';
    } else {
        document.getElementById('inputs').innerHTML = document.getElementById('inputs').innerHTML + ')';
        if (openingBrackets===closingBrackets+1) recalculateResult();
    }
}

function pressDot(){
    setStyles()
    let expression = document.getElementById('inputs').innerHTML;
    let pattern = /\d+(\.\d*)?/g
    if (expression.at(-1)==='%') return
    if (!/^\d$/g.test(expression.at(-1))){
        expression += '0';
    }
    if (![...expression.matchAll(pattern)].at(-1)[0].includes('.')) {
        document.getElementById('inputs').innerHTML = expression + ".";
    }
}

function pressDelete(){
    setStyles()
    let expression = document.getElementById('inputs').innerHTML
    let pattern = /​<span[^<]+>[^<]+<\/span>$/g
    if (pattern.test(expression)){
        document.getElementById('inputs').innerHTML = expression.replace(pattern, "")
        recalculateResult();
    } else {
        document.getElementById('inputs').innerHTML = expression.slice(0,-1);
        if (/^\d$/g.test(expression.at(-2))){
            recalculateResult();
        } else {
            clearResult();
        }
    }
    setSeparators();
}

function pressClear(){
    setStyles();
    document.getElementById('inputs').innerHTML = ''
    clearResult();
}

function pressEquals(){
    let result = document.getElementById('result').innerText
    if (result!==""){
        document.getElementById('inputs').innerHTML = document.getElementById('result').innerText;
        clearResult();
        document.getElementById('inputs').style.color = "var(--highlights-color)"
    }
}

function pressChangeSign(){
    setStyles()
    let expression = document.getElementById('inputs').innerHTML;
    let pattern = /\(​<span[^<]+>-<\/span>[\d,]+(\.\d*)?%?$/g
    let number = expression.match(/[\d,]+(\.\d*)?%?$/g)[0]
    if(pattern.test(expression)){
        expression = expression.replaceAll(pattern,number)
        recalculateResult()
    } else {
        if (number || /0(\.0*)?/g.test(number)) {
            expression = expression.replace(/[\d,]+(\.\d*)?%?$/g,
                "(&ZeroWidthSpace;<span class=\"operator_char\">-</span>" + number)
            clearResult();
        }
    }
    document.getElementById('inputs').innerHTML = expression

}

function pressPercent() {
    setStyles()
    let expression = document.getElementById('inputs').innerHTML;
    if (/^[\d.]$/g.test(expression.at(-1))){
        document.getElementById('inputs').innerHTML = expression + "%"
        recalculateResult();
        document.getElementById('expression').style.fontSize = 2 -
            0.5*(document.getElementById('inputs').innerText.length>12) + "rem"
    }

}

function setStyles(){
    document.getElementById('inputs').style.color = "var(--font-color)"
    document.getElementById('expression').style.fontSize = 2 -
        0.5*(document.getElementById('inputs').innerText.length>12) + "rem"
}

function pressedStyle(id){
    document.getElementById(id).style.backgroundColor = "var(--press-color)"
    document.getElementById(id).style.fontSize = "var(--pressed-font-size)"

}

function notPressedStyle(id){
    document.getElementById(id).style.backgroundColor = "var(--normal-color)"
    document.getElementById(id).style.fontSize = "var(--normal-font-size)"
}
