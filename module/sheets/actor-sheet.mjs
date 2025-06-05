/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
import { getRankAndDie } from "../helpers/utils.mjs";
export class myrpgActorSheet extends ActorSheet {
    /** @override */
    async _render(force = false, options = {}) {
        const min = isAbility ? 1 : 0;
        const max = 20;
        let value = parseInt(input.value, 10);
        if (Number.isNaN(value)) value = min;

        if (value < min) {
            ui.notifications.warn(game.i18n.format("MY_RPG.NumericWarning.Min", { label, min }));
            value = min;
        } else if (value > max) {
            ui.notifications.warn(game.i18n.format("MY_RPG.NumericWarning.Max", { label, max }));
            value = max;

        input.value = value;
        return value;
        const isAbility = input.name.includes("system.abilities.");
        // Èñïîëüçóåì ëîêàëèçàöèþ äëÿ íàçâàíèé òèïà ïîëÿ:
        // Äîáàâüòå â ëîêàëèçàöèè ñëåäóþùèå êëþ÷è: 
        // "MY_RPG.NumericWarning.Attribute": "Õàðàêòåðèñòèêà" (ru) / "Attribute" (en)
        // "MY_RPG.NumericWarning.Skill": "Íàâûê" (ru) / "Skill" (en)
        const labelKey = isAbility ? "MY_RPG.NumericWarning.Attribute" : "MY_RPG.NumericWarning.Skill";
        const label = game.i18n.localize(labelKey);
        const minVal = isAbility ? 1 : 0;
        const maxVal = 20;

        if (isNaN(val)) {
            val = minVal;
        }
        // Ïðè ïðåâûøåíèè ìèíèìàëüíîãî çíà÷åíèÿ – âûâîäèì óâåäîìëåíèå ñ ëîêàëèçîâàííûì òåêñòîì
        if (val < minVal) {
            // Â ëîêàëèçàöèÿõ äîáàâüòå êëþ÷ "MY_RPG.NumericWarning.Min"
            // Íàïðèìåð: ru.json: "{{label}} íå ìîæåò áûòü ìåíüøå {{min}}"
            //              en.json: "{{label}} cannot be less than {{min}}"
            ui.notifications.warn(game.i18n.format("MY_RPG.NumericWarning.Min", { label: label, min: minVal }));
            val = minVal;
        } else if (val > maxVal) {
            // Àíàëîãè÷íî äëÿ ìàêñèìàëüíîãî çíà÷åíèÿ – êëþ÷ "MY_RPG.NumericWarning.Max"
            // Íàïðèìåð: ru.json: "{{label}} íå ìîæåò áûòü áîëüøå {{max}}"
            //              en.json: "{{label}} cannot be greater than {{max}}"
            ui.notifications.warn(game.i18n.format("MY_RPG.NumericWarning.Max", { label: label, max: maxVal }));
            val = maxVal;
        }
        input.value = val;
        return val;
    }

    /**
 * Èíèöèàëèçèðóåò TinyMCE äëÿ çàäàííîãî ýëåìåíòà, åñëè îí åùå íå èíèöèàëèçèðîâàí.
 * @param {HTMLElement} element - DOM-ýëåìåíò textarea, äëÿ êîòîðîãî òðåáóåòñÿ TinyMCE.
 */
    initializeRichEditor(element) {
        if (!element._tinyMCEInitialized) {
            tinymce.init({
                target: element,
                inline: false,
                menubar: false,
                branding: false,
                statusbar: false,
                plugins: "autoresize link lists",
                toolbar: false,
                content_style: "body, p { margin: 0; padding: 0; font-family: inherit; font-size: inherit; color: #1b1210; }",
                autoresize_min_height: 40,
                autoresize_bottom_margin: 0,
                width: "100%",
                setup: function (editor) {
                    editor.on("init", function () {
                        // Äîïîëíèòåëüíûå íàñòðîéêè, åñëè íóæíû
                    });
                }
            });
            element._tinyMCEInitialized = true;
        }
    }

    /**
     * Ïîêàçûâàåò tooltip äëÿ ñòðîêè ñïîñîáíîñòè.
     * @param {jQuery} $row - jQuery îáúåêò ñòðîêè, äëÿ êîòîðîé ïîêàçûâàåòñÿ tooltip.
     * @param {Object} abilityData - äàííûå ñïîñîáíîñòè äëÿ îòîáðàæåíèÿ.
     */
    showAbilityTooltip($row, abilityData) {
        const costValue = abilityData.cost;
        const costText = costValue ?? "";
        const $tooltip = $(`
    <div class="ability-tooltip">
      <strong>${abilityData.name || ""}</strong><br/>
      <strong>${game.i18n.localize("MY_RPG.AbilityConfig.Rank")}:</strong> ${abilityData.rank || ""}<br/>
      <strong>${game.i18n.localize("MY_RPG.AbilityConfig.Effect")}:</strong> ${abilityData.effect || ""}<br/>
      <strong>${game.i18n.localize("MY_RPG.AbilityConfig.Desc")}:</strong><br/>${abilityData.desc || ""}<br/>
      <strong>${game.i18n.localize("MY_RPG.AbilityConfig.Cost")}:</strong> ${costText}<br/>
    </div>
  `);
        $("body").append($tooltip);
        $tooltip.css({
            position: "absolute",
            zIndex: 99999,
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            padding: "5px",
            boxShadow: "0 0 5px rgba(0,0,0,0.2)",
            pointerEvents: "none"
        });
        const rowOffset = $row.offset();
        const tooltipWidth = $tooltip.outerWidth();
        $tooltip.css({
            top: rowOffset.top + "px",
            left: (rowOffset.left - tooltipWidth - 10) + "px"
        });
        $row.data("tooltip", $tooltip);
    }

    /**
     * Óäàëÿåò tooltip, ñâÿçàííûé ñ çàäàííîé ñòðîêîé.
     * @param {jQuery} $row - jQuery îáúåêò ñòðîêè, äëÿ êîòîðîé óäàëÿåòñÿ tooltip.
     */
    hideAbilityTooltip($row) {
        const $tooltip = $row.data("tooltip");
        if ($tooltip) {
            $tooltip.remove();
            $row.removeData("tooltip");
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('.wound-box').click(this._onToggleWound.bind(this));

        // ----------------------------------------------------------------------
        // Rollable ýëåìåíòû (ïðèìåð)
        // ----------------------------------------------------------------------
        html.find(".rollable").click(this._onRoll.bind(this));

        // ----------------------------------------------------------------------
        // ÒÀÁËÈÖÀ ÑÏÎÑÎÁÍÎÑÒÅÉ
        // ----------------------------------------------------------------------
        const $table = html.find(".abilities-table");

        // Ïðè óõîäå êóðñîðà ñ òàáëèöû ñïîñîáíîñòåé óáèðàåì tooltip
        $table.on("mouseleave", () => {
            $("body").find(".ability-tooltip").remove();
        });

        // Ïîêàçûâàåì tooltip ïðè íàâåäåíèè íà ñòðîêó ñïîñîáíîñòè
        html.find("tr.ability-row").on("mouseenter", event => {
            const $row = $(event.currentTarget);
            const index = Number($row.data("index"));
            let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];
            if (!Array.isArray(abilities)) abilities = Object.values(abilities);
            const abilityData = abilities[index] || {};
            this.showAbilityTooltip($row, abilityData);
        });

        // Óáèðàåì tooltip, êîãäà êóðñîð óõîäèò ñî ñòðîêè
        html.find("tr.ability-row").on("mouseleave", event => {
            const $row = $(event.currentTarget);
            this.hideAbilityTooltip($row);
        });

        // Êíîïêà "Îòìåíà" (åñëè ãäå-òî èñïîëüçóåòñÿ)
        html.find(".ability-cancel").click(ev => {
            ev.preventDefault();
            this.close();
        });

        // Äîáàâèòü íîâóþ ñïîñîáíîñòü (ñòðîêó)
        html.find("tr.add-row").click(ev => {
            ev.preventDefault();
            let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];
            if (!Array.isArray(abilities)) abilities = Object.values(abilities);

            abilities.push({
                name: "",
                rank: "",
                desc: "",
                effect: "",
                cost: ""
            });

            this.actor.update({ "system.abilitiesList": abilities });
        });

        // Óäàëèòü ñïîñîáíîñòü
        html.find(".abilities-remove-row").click(ev => {
            ev.preventDefault();
            const index = Number(ev.currentTarget.dataset.index);
            new Dialog({
                title: game.i18n.localize("MY_RPG.Dialog.ConfirmDeleteTitle"),
                content: `<p>${game.i18n.localize("MY_RPG.Dialog.ConfirmDeleteMessage")}</p>`,
                buttons: {
                    yes: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.localize("MY_RPG.Dialog.Yes"),
                        callback: () => {
                            let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];
                            if (!Array.isArray(abilities)) {
                                abilities = Object.values(abilities);
                            }
                            abilities.splice(index, 1);
                            this.actor.update({ "system.abilitiesList": abilities });
                        }
                    },
                    no: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.localize("MY_RPG.Dialog.No")
                    }
                },
                default: "no"
            }).render(true);
        });

        // Ðåäàêòèðîâàíèå ñïîñîáíîñòè (TinyMCE ñ êîíòåêñòíûì ìåíþ)
        html.find("tr.ability-row").click(ev => {
            if ($(ev.target).closest(".abilities-remove-row").length) return;
            if (this._editing) {
                ui.notifications.warn(game.i18n.localize("MY_RPG.AbilityConfig.AlreadyEditing"));
                return;
            }
            ev.preventDefault();
            this._editing = true;

            const index = Number(ev.currentTarget.dataset.index);
            let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];
            if (!Array.isArray(abilities)) abilities = Object.values(abilities);
            const abilityData = abilities[index] || {};

            let diag = new Dialog({
                title: game.i18n.localize("MY_RPG.AbilityConfig.Title"),
                content: `
          <form>
            <div class="form-group">
              <label>${game.i18n.localize("MY_RPG.AbilityConfig.Name")}</label>
              <input type="text" name="name" value="${abilityData.name ?? ""}" />
            </div>
            <div class="form-group">
              <label>${game.i18n.localize("MY_RPG.AbilityConfig.Rank")}</label>
              <input type="text" name="rank" value="${abilityData.rank ?? ""}" />
            </div>
            <div class="form-group">
              <label>${game.i18n.localize("MY_RPG.AbilityConfig.Effect")}</label>
              <textarea name="effect" class="rich-editor">${abilityData.effect ?? ""}</textarea>
            </div>
            <div class="form-group">
              <label>${game.i18n.localize("MY_RPG.AbilityConfig.Desc")}</label>
              <textarea name="desc" class="rich-editor">${abilityData.desc ?? ""}</textarea>
            </div>
            <div class="form-group">
              <label>${game.i18n.localize("MY_RPG.AbilityConfig.Cost")}</label>
              <input type="number" name="cost" value="${abilityData.cost ?? ""}" />
            </div>
          </form>
        `,
                buttons: {
                    save: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.localize("MY_RPG.AbilityConfig.Save"),
                        callback: (htmlDialog) => {
                            tinymce.triggerSave();
                            const formEl = htmlDialog.find("form")[0];
                            const fd = new FormData(formEl);
                            let formData = {};
                            for (let [k, v] of fd.entries()) {
                                formData[k] = v;
                            }
                            abilities[index] = {
                                name: formData.name ?? "",
                                rank: formData.rank ?? "",
                                effect: formData.effect ?? "",
                                desc: formData.desc ?? "",
                                cost: formData.cost ?? ""
                            };
                            this.actor.update({ "system.abilitiesList": abilities });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.localize("MY_RPG.AbilityConfig.Cancel")
                    }
                },
                default: "save",
                close: () => {
                    this._editing = false;
                },
                render: (html) => {
                    html.find("textarea.rich-editor").each((index, element) => {
                        // Âûçûâàåì íîâûé ìåòîä èíèöèàëèçàöèè ðåäàêòîðà
                        this.initializeRichEditor(element);
                    });
                }
            });
            diag.render(true);
        });

        // ----------------------------------------------------------------------
        // ÒÀÁËÈÖÀ ÈÍÂÅÍÒÀÐß
        // ----------------------------------------------------------------------
        html.find(".inventory .add-row").click(ev => {
            ev.preventDefault();
            let inventory = foundry.utils.deepClone(this.actor.system.inventoryList) || [];
            if (!Array.isArray(inventory)) inventory = Object.values(inventory);
            inventory.push({
                name: "",
                desc: "",
                quantity: ""
            });
            this.actor.update({ "system.inventoryList": inventory });
        });

        html.find("tr.inventory-row").click(ev => {
            if ($(ev.target).closest(".inventory-remove-row").length) return;
            if (this._editing) {
                ui.notifications.warn(game.i18n.localize("MY_RPG.Inventory.AlreadyEditing"));
                return;
            }
            ev.preventDefault();
            this._editing = true;

            const index = Number(ev.currentTarget.dataset.index);
            let inventory = foundry.utils.deepClone(this.actor.system.inventoryList) || [];
            if (!Array.isArray(inventory)) inventory = Object.values(inventory);
            const itemData = inventory[index] || {};

            let diag = new Dialog({
                title: game.i18n.localize("MY_RPG.Inventory.EditTitle"),
                content: `
          <form>
            <div class="form-group">
              <label>${game.i18n.localize("MY_RPG.Inventory.Name")}</label>
              <input type="text" name="name" value="${itemData.name ?? ""}" />
            </div>
            <div class="form-group">
              <label>${game.i18n.localize("MY_RPG.Inventory.Description")}</label>
              <textarea name="desc" class="rich-editor">${itemData.desc ?? ""}</textarea>
            </div>
            <div class="form-group">
              <label>${game.i18n.localize("MY_RPG.Inventory.Quantity")}</label>
              <input type="number" name="quantity" value="${itemData.quantity ?? ""}" />
            </div>
          </form>
        `,
                buttons: {
                    save: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.localize("MY_RPG.Inventory.Save"),
                        callback: (htmlDialog) => {
                            tinymce.triggerSave();
                            const formEl = htmlDialog.find("form")[0];
                            const fd = new FormData(formEl);
                            let formData = {};
                            for (let [k, v] of fd.entries()) {
                                formData[k] = v;
                            }
                            inventory[index] = {
                                name: formData.name ?? "",
                                desc: formData.desc ?? "",
                                quantity: formData.quantity ?? ""
                            };
                            this.actor.update({ "system.inventoryList": inventory });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.localize("MY_RPG.Inventory.Cancel")
                    }
                },
                default: "save",
                close: () => {
                    this._editing = false;
                },
                render: (html) => {
                    html.find("textarea.rich-editor").each(function () {
                        if (!this._tinyMCEInitialized) {
                            tinymce.init({
                                target: this,
                                inline: false,
                                menubar: false,
                                branding: false,
                                statusbar: false,
                                plugins: "autoresize link lists",  // contextmenu óáðàí
                                toolbar: false,                   // ìîæíî óáðàòü èëè èçìåíèòü
                                // Åñëè âàì âñ¸-òàêè íóæíî êàêîå-ëèáî êîíòåêñòíîå ìåíþ, îçíàêîìüòåñü ñ äîêóìåíòàöèåé TinyMCE 6
                                content_style: "body { margin: 0; padding: 0; font-family: inherit; font-size: inherit; color: #1b1210; }",
                                autoresize_min_height: 40,
                                autoresize_bottom_margin: 0,
                                width: "100%",
                                setup: function (editor) {
                                    editor.on("init", function () {
                                        // Äîïîëíèòåëüíûå íàñòðîéêè, åñëè íóæíû
                                    });
                                }
                            });
                            this._tinyMCEInitialized = true;
                        }
                    });
                }
            });
            diag.render(true);
        });
        html.find(".inventory-remove-row").click(ev => {
            ev.preventDefault();
            const index = Number(ev.currentTarget.dataset.index);
            new Dialog({
                title: game.i18n.localize("MY_RPG.Inventory.ConfirmDeleteTitle"),
                content: `<p>${game.i18n.localize("MY_RPG.Inventory.ConfirmDeleteMessage")}</p>`,
                buttons: {
                    yes: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.localize("MY_RPG.Inventory.Yes"),
                        callback: () => {
                            let inventory = foundry.utils.deepClone(this.actor.system.inventoryList) || [];
                            if (!Array.isArray(inventory)) inventory = Object.values(inventory);
                            inventory.splice(index, 1);
                            this.actor.update({ "system.inventoryList": inventory });
                        }
                    },
                    no: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.localize("MY_RPG.Inventory.No")
                    }
                },
                default: "no"
            }).render(true);
        });

        html.find('input[name^="system.abilities."], input[name^="system.skills."]').on("change", ev => {
            const input = ev.currentTarget;
            // Âûçûâàåì íîâóþ ôóíêöèþ âàëèäàöèè
            const validatedValue = this.validateNumericInput(input);
            // Îáíîâëÿåì äàííûå àêòîðà áåç ïîâòîðíîãî ðåíäåðà
            this.actor.update({ [input.name]: validatedValue }, { render: false });
        });
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['myrpg', 'sheet', 'actor', 'myrpg-hex-tabs'],
            width: 800,
            height: 1000,
            resizable: false,
            tabs: [
                {
                    navSelector: '.sheet-tabs-hex',
                    contentSelector: '.sheet-body',
                    initial: 'features',
                    controlSelector: 'a.hex-button'
                }
            ]
        });
    }

    /** @override */
    get template() {
        if (this.actor.type === "npc") {
            return `systems/myrpg/templates/actor/actor-character-sheet.hbs`;
        }
        return `systems/myrpg/templates/actor/actor-${this.actor.type}-sheet.hbs`;
    }

    /** @override */
    getData() {
        const context = super.getData();
        const actorData = context.data;
        context.system = actorData.system;
        context.flags = actorData.flags;

        if (actorData.type === 'character' || actorData.type === 'npc') {
            this._prepareCharacterData(context);
        }

        context.rollData = context.actor.getRollData();
        return context;
    }

    _prepareCharacterData(context) {
        for (let [k, v] of Object.entries(context.system.abilities)) {
            v.label = game.i18n.localize(CONFIG.MY_RPG.abilities[k]) ?? k;
        }
        for (let [x, c] of Object.entries(context.system.skills)) {
            c.label = game.i18n.localize(CONFIG.MY_RPG.skills[x]) ?? x;
        }
    }

    /**
     * Îáðàáîòêà êëèêà ïî rollable-ýëåìåíòàì
     */
    async _onToggleWound(event) {
        const idx = parseInt(event.currentTarget.dataset.idx);
        let wounds = this.actor.system.wounds || 0;
        // Åñëè òåêóùåå êîëè÷åñòâî ðàíåíèé áîëüøå èíäåêñà, óìåíüøàåì, èíà÷å óâåëè÷èâàåì
        wounds = wounds > idx ? idx : idx + 1;
        await this.actor.update({ 'system.wounds': wounds });
    }

    async _onRoll(event) {
        event.preventDefault();
        const el = event.currentTarget;
        const { skill, ability, label } = el.dataset;

        let bonus = 0;
        let abVal = 0;

        if (skill) {
            bonus = parseInt(this.actor.system.skills[skill]?.value) || 0;
            const abKey = this.actor.system.skills[skill].ability;
            abVal = parseInt(this.actor.system.abilities[abKey]?.value) || 0;
        } else if (ability) {
            abVal = parseInt(this.actor.system.abilities[ability]?.value) || 0;
            bonus = abVal; // äëÿ áðîñêà ñàìîé õàðàêòåðèñòèêè
        }

        const { die } = getRankAndDie(abVal);
        const roll = await new Roll(`2d${die} + ${bonus}`).roll({ async: true });
        roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            flavor: label,
            rollMode: game.settings.get('core', 'rollMode')
        });
    }
}
