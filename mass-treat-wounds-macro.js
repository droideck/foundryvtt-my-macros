// The code is based on https://github.com/AdamantiteAdventurer/fvtt-macros-pf2e/blob/main/Treat%20Wounds%20Macro%20(Fancy).js

function CheckFeat(slug) {
    if (token.actor.items.find((i) => i.data.data.slug === slug && i.type === "feat")) {
        return true;
    }
    return false;
}
const rollTreatWounds = async ({ DC, bonus, med, riskysurgery, mortalhealing, tname }) => {
    const options = actor.getRollOptions(["all", "skill-check", "medicine"]);
    options.push("treat wounds");
    options.push("action:treat-wounds");
    const dc = {
        value: DC,
        visibility: "all",
    };
    if (riskysurgery || mortalhealing) {
        dc.modifiers = {
            success: "one-degree-better",
        };
    }
    if (riskysurgery) {
        options.push("risky-surgery");
    }
    med.roll({
        dc: dc,
        event: event,
        options: options,
        callback: async (roll) => {
            let healFormula, successLabel;
            const magicHands = CheckFeat("magic-hands");
            const bonusString = bonus > 0 ? `+ ${bonus}` : "";
            if (roll.data.degreeOfSuccess === 3) {
                if (tname === "Shad") {
                    healFormula = magicHands ? `32${bonusString}/2` : `4d8${bonusString}/2`;
                } else {
                    healFormula = magicHands ? `32${bonusString}` : `4d8${bonusString}`;
                }
                successLabel = "Critical Success";
            } else if (roll.data.degreeOfSuccess === 2) {
                if (tname === "Shad") {
                    healFormula = magicHands ? `16${bonusString}/2` : `2d8${bonusString}/2`;
                } else {
                    healFormula = magicHands ? `16${bonusString}` : `2d8${bonusString}`;
                }
                successLabel = "Success";
            } else if (roll.data.degreeOfSuccess === 1) {
                successLabel = "Failure";
            } else if (roll.data.degreeOfSuccess === 0) {
                successLabel = "Critical Failure";
            }
            if (riskysurgery) {
                ChatMessage.create({
                    user: game.user.id,
                    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                    flavor: `<strong>Damage Roll for ${tname}: Risky Surgery</strong>`,
                    roll: await new Roll(`{1d8}[slashing]`).roll({ async: true }),
                    speaker: ChatMessage.getSpeaker(),
                });
            }
            if (healFormula !== undefined) {
                const healRoll = await new Roll(`{${healFormula}}[healing]`).roll({ async: true });
                const rollType = roll.data.degreeOfSuccess > 1 ? "Healing" : "Damage";
                ChatMessage.create({
                    user: game.user.id,
                    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                    flavor: `<strong>${rollType} Roll for ${tname}: Treat Wounds</strong> (${successLabel})`,
                    roll: healRoll,
                    speaker: ChatMessage.getSpeaker(),
                });
            }
        },
    });
};

async function applyChanges($html) {
    var cList = {"Borji": false,
                 "Venus": false,
                 "Hella": true,
                 "Maciek": true,
                 "Mizuki": true,
                 "Athena": true,
                 "Shad": true,
                 "Chance": true};
    var hUntil = {"Borji": 0,
                  "Venus": 0,
                  "Hella": 0,
                  "Maciek": 0,
                  "Mizuki": 0,
                  "Athena": 0,
                  "Shad": 0,
                  "Chance": 0};
    var hpnow = 0;
    var hpuntil = 0;
    var riskysurgery = false;
    var tname = "";
    var messageTable = "";
    for (const charname of Object.keys(cList)) {
        if ($html.find(`[name="${charname.toLowerCase()}"]`)[0]?.checked) {
            cList[charname] = true;
        } else {
            cList[charname] = false;
        }
    }
    for (const charname of Object.keys(hUntil)) {
        hUntil[charname] = parseInt($html.find(`[name="${charname.toLowerCase()}hhp"]`).val()) || 0;
    }
    for (const ttoken of canvas.tokens.controlled) {
        tname = ttoken.data.name;
        if (Object.keys(cList).includes(tname) && cList[tname]) {
            hpnow = ttoken.actor.data.data.attributes.hp.value;
            hpuntil = hUntil[tname];
            if (hpnow < hpuntil) {
                if (hpnow < 17 || tname === "Shad") {
                    riskysurgery = false;
                    messageTable = "<b>" + tname + "</b>";
                } else {
                    riskysurgery = true;
                    messageTable = "<b>Risky " + tname + "</b>";
                }
                var chatData = {
                    user: game.user._id,
                    speaker: ChatMessage.getSpeaker(),
                    content: messageTable,
                };
                ChatMessage.create(chatData, {});
                for (const token of canvas.tokens.controlled) {
                    const { name } = token;
                    if (name !== "Hella"){
                        continue;
                    }
                    var med = token.actor.data.data.skills.med;
                    if (!med) {
                        ui.notifications.warn(`Token ${token.name} does not have the medicine skill`);
                        continue;
                    }
                    const mod = parseInt($html.find('[name="modifier"]').val()) || 0;
                    const requestedProf = parseInt($html.find('[name="dc-type"]')[0].value) || 1;
                    // const riskysurgery = $html.find('[name="risky_surgery_bool"]')[0]?.checked;
                    const mortalhealing = $html.find('[name="mortal_healing_bool"]')[0]?.checked;
                    const skill = $html.find('[name="skill"]')[0]?.value;
                    // Handle Rule Interpretation
                    if (game.user.isGM) {
                        await game.settings.set(
                            "pf2e",
                            "RAI.TreatWoundsAltSkills",
                            $html.find('[name="strict_rules"]')[0]?.checked
                        );
                    }
                    var usedProf = 0;
                    if (game.settings.get("pf2e", "RAI.TreatWoundsAltSkills")) {
                        if (skill === "cra") {
                            med = token.actor.data.data.skills["cra"];
                        }
                        if (skill === "nat") {
                            med = token.actor.data.data.skills["nat"];
                        }
                        usedProf = requestedProf <= med.rank ? requestedProf : med.rank;
                    } else {
                        usedProf = requestedProf <= med.rank ? requestedProf : med.rank;
                        if (skill === "cra") {
                            med = token.actor.data.data.skills["cra"];
                        }
                        if (skill === "nat") {
                            med = token.actor.data.data.skills["nat"];
                            if (usedProf === 0) {
                                usedProf = 1;
                            }
                        }
                    }
                    const medicBonus = CheckFeat("medic-dedication") ? (usedProf - 1) * 5 : 0;
                    const roll = [
                        () => ui.notifications.warn(`${name} is not trained in Medicine and doesn't know how to treat wounds.`),
                        () => rollTreatWounds({ DC: 15 + mod, bonus: 0 + medicBonus, med, riskysurgery, mortalhealing, tname }),
                        () => rollTreatWounds({ DC: 20 + mod, bonus: 10 + medicBonus, med, riskysurgery, mortalhealing, tname }),
                        () => rollTreatWounds({ DC: 30 + mod, bonus: 30 + medicBonus, med, riskysurgery, mortalhealing, tname }),
                        () => rollTreatWounds({ DC: 40 + mod, bonus: 50 + medicBonus, med, riskysurgery, mortalhealing, tname }),
                    ][usedProf];
                    roll();
                }
            }
        }
    }
}
if (token === undefined) {
    ui.notifications.warn("No token is selected.");
} else {
    const chirurgeon = CheckFeat("chirurgeon");
    const naturalMedicine = CheckFeat("natural-medicine");
    const dialog = new Dialog({
        title: "Treat Wounds",
        content: `
<div>Select a target DC. Remember that you can't attempt a heal above your proficiency. Attempting to do so will downgrade the DC and amount healed to the highest you're capable of.</div>
<hr/>
<form>
<div class="form-group">
<label>Heal Borji</label>
<input type="checkbox" id="borji" name="borji"></input>
<label>Until HP</label>
<input id="borjihhp" name="borjihhp" type="number" value="35"/>
</div>
</form>
<form>
<div class="form-group">
<label>Heal Venus</label>
<input type="checkbox" id="venus" name="venus"></input>
<label>Until HP</label>
<input id="venushhp" name="venushhp" type="number" value="34"/>
</div>
</form>
<hr/>
<form>
<div class="form-group">
<label>Heal Hella</label>
<input type="checkbox" id="hella" name="hella" checked></input>
<label>Until HP</label>
<input id="hellahhp" name="hellahhp" type="number" value="53"/>
</div>
</form>
<hr/>
<form>
<div class="form-group">
<label>Heal Maciek</label>
<input type="checkbox" id="maciek" name="maciek" checked></input>
<label>Until HP</label>
<input id="maciekhhp" name="maciekhhp" type="number" value="48"/>
</div>
</form>
<hr/>
<form>
<div class="form-group">
<label>Heal Mizuki</label>
<input type="checkbox" id="mizuki" name="mizuki" checked></input>
<label>Until HP</label>
<input id="mizukihhp" name="mizukihhp" type="number" value="41"/>
</div>
</form>
<form>
<div class="form-group">
<label>Heal Athena</label>
<input type="checkbox" id="athena" name="athena" checked></input>
<label>Until HP</label>
<input id="athenahhp" name="athenahhp" type="number" value="18"/>
</div>
</form>
<hr/>
<form>
<div class="form-group">
<label>Heal Shad</label>
<input type="checkbox" id="shad" name="shad" checked></input>
<label>Until HP</label>
<input id="shadhhp" name="shadhhp" type="number" value="40"/>
</div>
</form>
<form>
<div class="form-group">
<label>Heal Chance</label>
<input type="checkbox" id="chance" name="chance" checked></input>
<label>Until HP</label>
<input id="chancehhp" name="chancehhp" type="number" value="18"/>
</div>
</form>
${
    chirurgeon || naturalMedicine
        ? `
<form>
<div class="form-group">
<label>Treat Wounds Skill:</label>
<select id="skill" name="skill">
<option value="med">Medicine</option>
${chirurgeon ? `<option value="cra">Crafting</option>` : ``}
${naturalMedicine ? `<option value="nat">Nature</option>` : ``}
</select>
</div>
</form>
`
        : ``
}
<form>
<div class="form-group">
<label>Medicine DC:</label>
<select id="dc-type" name="dc-type">
<option value="1">Trained DC 15</option>
<option value="2">Expert DC 20, +10 Healing</option>
<option value="3">Master DC 30, +30 Healing</option>
<option value="4">Legendary DC 40, +50 Healing</option>
</select>
</div>
</form>
<form>
<div class="form-group">
<label>DC Modifier:</label>
<input id="modifier" name="modifier" type="number"/>
</div>
</form>
${
    CheckFeat("xxxrisky-surgery")
        ? `<form><div class="form-group">
<label>Risky Surgery</label>
<input type="checkbox" id="risky_surgery_bool" name="risky_surgery_bool"></input>
</div></form>`
        : ``
}
${
    CheckFeat("mortal-healing")
        ? `<form><div class="form-group">
<label>Mortal Healing</label>
<input type="checkbox" id="mortal_healing_bool" name="mortal_healing_bool" checked></input>
</div></form>`
        : ``
}
${
    game.user.isGM
        ? `<form><div class="form-group">
<label>Allow higher DC from alternate skills?</label>
<input type="checkbox" id="strict_rules" name="strict_rules"` +
          (game.settings.get("pf2e", "RAI.TreatWoundsAltSkills") ? ` checked` : ``) +
          `></input>
</div></form>`
        : ``
}
</form>
`,
        buttons: {
            yes: {
                icon: `<i class="fas fa-hand-holding-medical"></i>`,
                label: "Treat Wounds",
                callback: applyChanges,
            },
            no: {
                icon: `<i class="fas fa-times"></i>`,
                label: "Cancel",
            },
        },
        default: "yes",
    });
    dialog.render(true);
}
