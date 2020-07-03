/*
Fork From Hibot (모니카) - Project M
© 2020 Dark Tornado, All rights reserved.
version 1.0
Just Hibot!
*/

const sdcard = android.os.Environment.getExternalStorageDirectory().getAbsolutePath();

const Hibot = {};
const preChat = {};
const chatData = {};

Hibot.VERSION = "1.0";
Hibot.MODE = "RUN";
Hibot.init = function() {
    var file = new java.io.File(sdcard + "/Hibot/");
    file.mkdirs();
    var files = file.list();
    for (var n = 0; n < files.length; n++) {
        var room = files[n].replace(".txt", "");
        var data = Hibot.read(room);
        if (data == null) chatData[room] = [];
        else chatData[room] = data.split("\n");
    }
};
Hibot.read = function(name) {
    return FileStream.read(sdcard + "/Hibot/" + name + ".txt");
};
Hibot.save = function(name, value) {
    FileStream.write(sdcard + "/Hibot/" + name + ".txt", value);
};
Hibot.isValidData = function(msg) {
    var noStudy = ["\n", "//"];
    for (var n = 0; n < noStudy.length; n++) {
        if (msg.indexOf(noStudy[n]) != -1) return false;
    }
    return true;
};
Hibot.getReply = function(chatData, msg) {
    msg = msg.split(" ");
    var result = [];
    for (var n = 0; n < chatData.length - 1; n++) {
        if (Hibot.checkWord(chatData[n], msg)) result.push(chatData[n + 1]);
    }
    if (result.length == 0) return null;
    else return result[Math.floor(Math.random() * result.length)];
};
Hibot.checkWord = function(chat, msg) {
    for (var n = 0; n < msg.length; n++) {
        return chat.includes(msg[n]);
    }
};

Hibot.init();

function response(room, msg, sender, isGroupChat, replier) {
    if (preChat[room] == msg) return;
    preChat[room] = msg;
    if (chatData[room] == undefined) chatData[room] = [];

    var cmd = msg.split(" ")[0];
    var data = cmd.replace(cmd + " ", "");
    if (msg == "/hibot") {
        replier.reply("이름 : Hibot\n버전 : "+Hibot.VERSION+"\nDB : "+chatData[room].length);
    }
    if (msg == "hibot") {
        replier.reply("이것은 그것이다. 인사봇");
    }
    if (msg == "/DB") {
        replier.reply(chatData[room].length + "개");
    }
    if (msg.startsWith("/mode")) {
        Hibot.MODE = msg.split(" ")[1];
    }
	if(Hibot.MODE == "RUN" || Hibot.MODE == "STUDY"){
		var noReply = [".", "사진", "동영상", "음성메시지", "카카오톡 프로필", "(이모티콘)", "카카오링크", "카카오링크 이미지"];
		for (var n = 0; n < noReply.length; n++) {
			if (msg == noReply[n]) return;
		}
	}
	if(Hibot.MODE == "RUN"){
		if (Math.floor(Math.random() * 20) == 0) {
			var result = Hibot.getReply(chatData[room], msg);
			if (result != null) replier.reply(result);
		}

		if (Hibot.isValidData(msg)) {
			chatData[room].push(msg);
			Hibot.save(room, chatData[room].join("\n"));
		}
	}

}

