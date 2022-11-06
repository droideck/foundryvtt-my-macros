let shuffled = {"main": 0,
                "north": 0,
                "central": 0,
                "south": 0}
for (var i = 1; i <= 7; i++) {
    let l = new Roll("1d4");
    l.roll({
        async: !1
    });
    let j = l._total
    switch (j) {
        case 1:
            shuffled["main"]++;
            break;
        case 2:
            shuffled["north"]++;
            break;
        case 3:
            shuffled["central"]++;
            break;
        case 4:
            shuffled["south"]++;
    }
 }
a = `<div class="pf2e chat-card"><table>`
for (const s in shuffled) {
    a += `<tr title="shuffletable-${s}"><td><b>${s}</b></td><td>${shuffled[s]}</td>`
}
a += "</table></div>";
ChatMessage.create({
    user: game.user._id,
    content: a,
    whisper: ChatMessage.getWhisperRecipients("GM"),
    blind: !0
}, {})