/*
Project - M
5th Open Source : Moka
© 2018 Dark Tornado, All rights reserved.
<작동 방식>
1. 채팅방에서 사람들이 하는 채팅을 '내장메모리/Hina/' 폴더에 'DB.json' 파일로 저장.
  -> 각 채팅들은 JSON으로 구분합니다.
  -> 학습 및 채팅 전송은 채팅방마다 따로따로 작동합니다.
2. 해당 채팅방에서 채팅이 수신되면 10% 확률로 수신된 채팅과 파일 안에 있는 채팅의 유사도를 대충 검사.
  -> 한글 분해해서 85% 이상 일치하면 유사하다고 봄.
3. 유사하다고 판단된 채팅들에 대한 답변을 채팅방으로 전송.
  -> 배운게 없으면 전송 안함
4. 귀찮은 관계로 createDB는 뺐습니다. Hina/DB.json에 직접 '{}'라는 내용을 써 주세요
<가이드라인>
- 개발자의 허락 없이 소스 코드 무단 배포 금지. 들키면, 싸대기 퍽퍽. 어라... 맞아야지
- 소스 사용시 원작자를 밝혀주세요.
  ex) 이 봇은 Dark Tornado의 Project M - Moka 소스를 사용하였습니다.
<라이선스>
이 소스에는 LGPL 3.0이 적용되어있습니다.
one line to give the library's name and an idea of what it does.
Copyright (C) 2018  Dark Tornado
This library is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License as published by the Free Software Foundation; either
version 2.1 of the License, or (at your option) any later version.
This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License for more details.
You should have received a copy of the GNU Lesser General Public
License along with this library; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*/


/*상수 선언*/
const levenshtein = require('levenshtein');
const sdcard = android.os.Environment.getExternalStorageDirectory().getAbsolutePath(); //내장메모리 최상위 경로

/*상수 (객체) 선언*/
const Hina = {}; //Hina 관련 객체
const DB = {}; //파일 입/출력용 객제인데, 이름이 DB인건 기분탓
const preChat = {};//이전체팅
var learn = {};//대충 배운단어들
const say = ['왜?', '그래그래, 그럴수도 있지', 
        '로리콘 주제에!', '뭐.', '로리콘은 병입니다',
        '로1코봇이 될테야', '혹시, 경찰서 가볼 생각 없어?',
        '지금 VPN켜고 뭐 보고 있는거야? :)', '>_<', '저기, 좋아한다는건, 뭔가요?',
        '오늘따라 뭔가 이상하네', '남자친구야!\n(그렇게 되고 싶었으니까...)',
        '나 좋아하는 사람이 있어, 계속 좋아해.', '조금 키 컸다고 잘난 척은',
        '저... 팬티...가...', '신경 쓰인다? 왜 선배가 신경 쓰이는 거지?',
    '나... 차였네', '뭐? 로리콘 주제에!',
    '고백실행위원회 ~연애 시리즈~' + '\u200b'.repeat(500) + '\n告白実行委員会 ~恋愛シリーズ~\n'
    + '세토구치 히나(瀬戸口 雛)\n'
    + '사쿠라가오카 고교 육상부 2학년(桜ヶ丘高等学校陸上部2年生)\n'
    + '생일(誕生日): 8월 8일(8月8日)\n'
    + '혈액형(血液型): A형(A型)\n'
    + '신장(身長): 149cm\n'
    + '형제(兄弟)：세토구치 유우(瀬戸口優), 2살 위 오빠(2歳位兄)'];
toKorChars = function(str) {//https://link.medium.com/BGbSELtNU7 대충 한글 분해
    let cCho = [ 'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ',
      'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
      'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ',
      'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ' ], 
      cJung = [ 'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ',
      'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
      'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ',
      'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ',
      'ㅣ' ], 
      cJong = [ '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ',
      'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
      'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ',
      'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
      'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ',
      'ㅌ', 'ㅍ', 'ㅎ' ], cho, jung, jong;
    let cnt = str.length, chars = [], cCode;
    for (let i = 0; i < cnt; i++) {
        cCode = str.charCodeAt(i);
        if (cCode == 32) { continue; }//한글이 아닌 경우
        if (cCode < 0xAC00 || cCode > 0xD7A3) {
            chars.push(str.charAt(i));
            continue;
        }
        cCode = str.charCodeAt(i) - 0xAC00;
        jong = cCode % 28;//종성
        jung = ((cCode - jong) / 28 ) % 21;//중성
        cho = (((cCode - jong) / 28 ) - jung ) / 21;//초성
        chars.push(cCho[cho], cJung[jung]);
        if (cJong[jong] !== '') {
            chars.push(cJong[jong]);
        }
    }
    return chars;
}
function randInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
/*Hina 객체*/
Hina.checkWord = function (que, msg) { //적당히 비슷한 말인지 비교
    let distance = levenshtein.get(que, msg); //거리분석
    if(distance > Math.max(que.length, msg.length) / 2) return Number.MAX_SAFE_INTEGER;
    return distance;
}
Hina.getReply = function (msg, data) { //수신된 채팅에 대한 적당한 답변 반환
    if (data != null) { //저장된 채팅이 없으면 작동 안함
        let result = []; //비슷한 말들이 들어갈 배열
        msg = toKorChars(msg).join();//미리 분해
        let min = Number.MAX_SAFE_INTEGER - 1; //최대 유사도 값, Number.MAX_SAFE_INTEGER로 지정되는 것은 말해선 안될 것
        for (let n = 0; n < data.length - 1; n++) { //저장된 채팅들 중 비슷하다 싶은 녀석들을 배열에 넣을건데
            if(data[n + 1].isContinue) continue;
            let count = Hina.checkWord(data[n]['decomposedMsg'], msg); //유사도(?)를 가져와서
            //Log.d(data[n]['msg'] + '/' + msg + '\n' + count);
            if (count < min) { //기존에 확인했던 녀석들보다 유사도가 낮으면, 결과 배열 초기화 및 최소 유사도 값 변경
                min = count;
                result = [];
            }
            if (count == min) { //이미 유사도가 더 높은 말이 있다면, 저장 안함
              data[n + 1].pos = n;
                result.push(data[n + 1]); //배열에 추가
            }
        }
        if (result[0] != null)
            return result[randInt(0, result.length - 1)]; //배열이 빈게 아니라면 아무거나 하나 반환
    }
    return null; //일치하는게 없거나, 저장된 채팅이 없으면, null 반환
}
Hina.say = function(msg, replier) { //그냥 말하는 함수
	replier.reply(msg); //앞에다가 이상한 문구 붙이는 용도
};
Hina.isValidData = function(msg) { //배울 만한 채팅인지
    let invalids = ['샵검색: #', '파일: ', 'eval', '이발', '.이발'];
    for (let n = 0; n < invalids.length; n++) {
        if (msg.startsWith(invalids[n])) return false; //특정 문자로 시작하는 것은 학습 X.	
    }
    let noStudy = ['[', 'var',
      ']', '{', '}', '⎼', '.com',
      '.tk', '.org', '.kr', '.net', '.xxx',
      '.gov', '.la', '.xxx', '<', '>',
      '_', '\\', '\n', 'new ', '.be',
      '.io', 'let', 'val', '/', '.me',
      '.us', '::', '+ ', '- ', '*', '보냈어요.', 'null', 'undefined', 'NaN', '보냈아요'];
    for (let n = 0; n < noStudy.length; n++) {
        if (msg.includes(noStudy[n])) return false; //특정 문자를 포함하는거는 학습 X.
    }
	  return true;
};

/*DB 객체*/

DB.saveData = function(content) { //파일에 내용을 저장하는 함수
	  FileStream.write(sdcard + '/Hina/DB.json', content);
};
DB.readData = function(path) { //파일에 저장된 내용을 불러오는 함수
    return FileStream.read(sdcard + '/Hina/DB.json');
};


/*전역에서 실행할 것들*/
learn = JSON.parse(DB.readData());

/*response 부분*/
function response(room, msg, sender, isGroupChat, replier) {
    if(room == '도배 해주지마세요' || room.startsWith('카카오톡 봇')) return;
    if(typeof preChat[room] === 'undefined') preChat[room] = {};
    /*봇 작동여부 결정 및 명령어 처리*/
    if(typeof learn[room] === 'undefined')
        learn[room] = [];
    if(preChat[room]['msg'] == msg) return;
    procCmd(msg, room, replier);
    if ((msg.includes('히나') || msg.includes('hina')) && Hina.isValidData(msg)){
        replier.reply(say[randInt(0, say.length - 1)]);
        return;
    }
    /*적당한 채팅 하나 가져와서 답장(?)하는 부분*/
    let test = msg.startsWith('/saytest');
    if (randInt(1,100)<=1 || test) { //2% 확률로 작동
        msg = msg.replace('/saytest ', '');
        let data = learn[room]; //저장된 채팅들을 불러옴
        let reply = Hina.getReply(msg, data), pos; //적당한거 하나 가져와서
        Log.debug(JSON.stringify(reply));
        if(reply != null){
            pos = reply.pos;
            do{
                Hina.say(reply.msg, replier); //전송
                try{
                    pos++;
                    reply = data[pos + 1];
                }catch(e){
                    Log.e(e + '\n'+ reply.pos);
                    break;
                }
                //Log.debug('다음: '+JSON.stringify(reply));
                if(reply == undefined) break;
            }while(reply.isContinue);
        }else if(test){
            Hina.say('할 말이 없는거에요(null)', replier);
        }
    }
    let senderBlackList = ['Eungo', '[Bot]', '[AI]', '개소리봇', '𝔅𝔬𝔱', '𝕭𝖔𝖙', '𝔹𝕠𝕥', 'Bot', '은고', '민트', '세상에서', '방장봇'];//전송자 닉넴에 이런거 들어있으면 벤(?)
    for (let n = 0; n < senderBlackList.length; n++) {
        if (sender.includes(senderBlackList[n])) return;
    }
    /*채팅을 학습하는 부분*/
    if (Hina.isValidData(msg)) { //배울 만한 채팅인 경우,
        let data = learn[room]; //배운 채팅 목록을 가져옴
        let chatPush = {};//push 할 체팅수
        chatPush['msg'] = msg;
        chatPush['decomposedMsg'] = toKorChars(msg).join('');
        if (data == null) { //아직 배운게 없다면,
            data[room] = [];//텅텅
        }
        if(typeof preChat[room]['sender'] !== 'undefined') chatPush['isContinue'] = (preChat[room]['sender'] == sender);//계속 이어지는 체팅인가
        else chatPush['isContinue'] = false;//만약 첫 체팅이면 false
        data.push(chatPush);//넣어버렷
        DB.saveData(JSON.stringify(learn, null, '\t'));
    }
    preChat[room] = {};
    preChat[room]['msg'] = msg;
    preChat[room]['sender'] = sender;
}

/*그냥 명령어 목록*/
function procCmd(cmd, room, r) {
    if(cmd.startsWith('/clear ')){
      learn[cmd.replace('/clear ', '')] = [];
      DB.saveData(JSON.stringify(learn, null, '\t'));
      Hina.say('말끔하게 지운거에요', r);
    }
    switch (cmd) {
    case '/hina':
    Hina.say('[귀여운 Hina]\nVer 1.3\n봇주: 없음\n©Dark Tornado, Hibot all rights reserved.', r);
    break;
    case '/DB':
        let data = learn[room];
        if (data == null)
            Hina.say('0개', r);
        else
            Hina.say(data.length + '개', r);
        break;
    }
}
