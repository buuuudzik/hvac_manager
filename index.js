// ogólne funkcje
let isUndef = v => typeof v === 'undefined';
let isNotUndef = v => typeof v !== 'undefined';

function generateClassNameFromPercent(classPrefix, v) {
    let className = v>0 ? `${classPrefix}-${parseInt((v-1)/20+1)}` : `${classPrefix}-0`;
    if (className) return className;
};
function generateClassNameFromStep(classPrefix, v) {return `${classPrefix}-${v}`;};

let findAndRemoveFromTable = (t, v) => {
    let i = t.indexOf(v);
    if (i >= 0) t.splice(i, 1);
};

let findAndRemoveManyFromTable = (t, vs) => {
    for (let v of vs) findAndRemoveFromTable = (t, v);
};

// UWAGA!! WIĘKSZOŚĆ Z PONIŻSZYCH FUNKCJI POWINNA BYĆ WYZWALANA POPRZEZ CALL/UPPLY/BIND (Z PRZEKAZANIEM KONTEKSTU)
function addClass(className) {
    if (!this.hasClass(className)) this.addClass(className);
};
function removeClass(className) {
    if (this.hasClass(className)) this.removeClass(className);
};
function addAndRemoveClasses(toRemove, toAdd) {
    if (typeof toRemove === 'string') removeClass.call(this, toRemove);
    else for (let className of toRemove) if (!toAdd.includes(className)) removeClass.call(this, className);

    if (typeof toAdd === 'string') addClass.call(this, toAdd);
    else for (let className of toAdd) addClass.call(this, className);
};
function checkIfAllPropertiesExists(t) {
    return t.every(v => isNotUndef(this[v]));
};
function findAndAddAsOnlyClass(p, n, possibleClasses) {
    let founded = false;
    for (let c of possibleClasses) {
        if (p.hasClass(c)) {
            findAndRemoveFromTable(possibleClasses, c);
            addAndRemoveClasses.call(n, possibleClasses, c);
            founded = true;
            break;
        };
    };
    if (!founded) addAndRemoveClasses.call(n, possibleClasses, []);
};

// DEKORATORY
function decorateNormalBoolValue(DOMObject, currRawValue, currValue, classPrefix) {
    let currValueDOM = DOMObject.text();

    if (currValue !== currValueDOM) {
        // ZASTĄP WARTOŚĆ
        DOMObject.text(currValue);
        
        // ODPOWIEDNIA DEKORACJA WARTOŚCI, KLASY 'state-on', 'state-off'
        if (currRawValue) addAndRemoveClasses.call(DOMObject, `${classPrefix}-off`, `${classPrefix}-on`);
        else addAndRemoveClasses.call(DOMObject, `${classPrefix}-on`, `${classPrefix}-off`);
    };
};

// Dekorator, który pracuje dla wartości 0-100% lub 0-5(w zależności od podanej funkcji transformFunction) w trybie heat/cool
function decorateHVACValue(DOMObject, currHeatRawValue, currCoolRawValue, currRawValue, currValue, transformFunction) {
    let currValueDOM, objectToDecorate;

    if (DOMObject.is('.fan-step-value')) {
        currValueDOM = DOMObject.text();
        objectToDecorate = DOMObject.parent();
    } else {
        currValueDOM = DOMObject.text();
        objectToDecorate = DOMObject;
    };

    if (currValue !== currValueDOM) DOMObject.text(currValue);
    
    let toRemove = ['error'];
    for (let i=0; i<6; i++) toRemove.push(`heat-value-${i}`, `cool-value-${i}`);

    if (currHeatRawValue && !currCoolRawValue) {
        let classPrefix = 'heat-value';
        let className = transformFunction(classPrefix, currRawValue);
        findAndRemoveFromTable(toRemove, className);
        addAndRemoveClasses.call(objectToDecorate, toRemove, className);
    } else if (!currHeatRawValue && currCoolRawValue) {
        let classPrefix = 'cool-value';
        let className = transformFunction(classPrefix, currRawValue);
        findAndRemoveFromTable(toRemove, className);
        addAndRemoveClasses.call(objectToDecorate, toRemove, className);
    } else if (!currHeatRawValue && !currCoolRawValue) {
        // DOMYŚLNIE GDY OBA SĄ WYŁĄCZONE
        let className = 'cool-value-0';
        findAndRemoveFromTable(toRemove, className);
        addAndRemoveClasses.call(objectToDecorate, toRemove, className);
    } else {
        // DOMYŚNIE GDY OBIE ZMIENNE SĄ WŁĄCZONE (BŁĄD)
        let className = 'error';
        findAndRemoveFromTable(toRemove, className);
        addAndRemoveClasses.call(objectToDecorate, toRemove, className);
    };
};

function decorateTempValue(hvacMode) {
    let {tempDOM} = this;
    let currTempValue = this.getTemp();
    let currTempValueDOM = Number(this.tempDOM.text());

    let tempPossibleClasses = ['temp-hvac-off'];
    let tempClasses = [];

    // OBLICZ WARTOŚĆ
    // FILTRUJ WARTOŚĆ BIORĄC POD UWAGĘ STAN BUDYNKU
    if (hvacMode === 0 || hvacMode === 1) { // AUTO LUB HEAT
        // MOŻE KOLOROWAĆ NA POMARAŃCZOWO
        findAndRemoveFromTable(tempClasses, 'temp-cooling');
    } else if (hvacMode === 3) { // COOL
        // MOŻE KOLOROWAĆ NA NIEBIESKI
        findAndRemoveFromTable(tempClasses, 'temp-heating');
    } else if (hvacMode === 255) { // OFF
        // NIE KOLORUJ NIC
        tempClasses = ['temp-hvac-off'];
    };

    // UDEKORUJ TEMP
    if (currTempValueDOM !== currTempValue) tempDOM.text(currTempValue);
    addAndRemoveClasses.call(tempDOM, tempPossibleClasses, tempClasses);
};

function decorateTempAndSetpValue(hvacMode) {
    let heating = this[HEAT_GA];
    let cooling = this[COOL_GA];
    let {tempDOM} = this;
    let currTempValue = this.getTemp();
    let currTempValueDOM = Number(this.tempDOM.text());
    let {setpDOM} = this;
    let currSetpValue = this.getSetp();
    let currSetpValueDOM = Number(setpDOM.text());

    let tempPossibleClasses = ['temp-heating', 'temp-cooling', 'big-difference', 'temp-hvac-off'];
    let setpPossibleClasses = ['cold-setp', 'cool-setp', 'eco-setp', 'warm-setp', 'hot-setp', 'setp-hvac-off'];
    let tempClasses = [], setpClasses = [];

    // OBLICZ WARTOŚĆ
    // KOLOR TŁA TEMP POKAZUJE CZY ZAWÓR JEST OTWARTY (> +/-0.5 RÓŻNICY POMIĘDZY TEMP A SETP)
    if (Math.abs(currTempValue - currSetpValue) >= 0.5) {
        if (heating) tempClasses.push('temp-heating');
        else if (cooling) tempClasses.push('temp-cooling');

        // TEMP JEST POGRUBIONA GDY POMIĘDZY TEMP A SETP JEST CO NAJMNIEJ 3 STOPNIE RÓŻNICY
        if (Math.abs(currTempValue - currSetpValue) >= 3) tempClasses.push('big-difference');
    };

    // KOLOR SETP POKAZUJE POZIOM OSZCZĘDNOŚCI
    if (currSetpValue < 16) setpClasses.push('cold-setp');
    else if (currSetpValue >= 16 && currSetpValue < 19) setpClasses.push('cool-setp');
    else if (currSetpValue >= 19 && currSetpValue < 22) setpClasses.push('eco-setp');
    else if (currSetpValue >= 22 && currSetpValue < 26) setpClasses.push('warm-setp');
    else setpClasses.push('hot-setp');
    
    // FILTRUJ WARTOŚĆ BIORĄC POD UWAGĘ STAN BUDYNKU
    if (hvacMode === 0 || hvacMode === 1) { // AUTO LUB HEAT
        // MOŻE KOLOROWAĆ NA POMARAŃCZOWO
        findAndRemoveFromTable(tempClasses, 'temp-cooling');

    } else if (hvacMode === 3) { // COOL
        // MOŻE KOLOROWAĆ NA NIEBIESKI
        findAndRemoveFromTable(tempClasses, 'temp-heating');
    } else if (hvacMode === 255) { // OFF
        // NIE KOLORUJ NIC
        setpClasses = ['setp-hvac-off'];
        tempClasses = ['temp-hvac-off'];
    };

    // UDEKORUJ TEMP
    if (currTempValueDOM !== currTempValue) tempDOM.text(currTempValue);
    addAndRemoveClasses.call(tempDOM, tempPossibleClasses, tempClasses);

    // UDEKORUJ SETP
    if (currSetpValueDOM !== currSetpValue) setpDOM.text(currSetpValue);
    addAndRemoveClasses.call(setpDOM.parent(), setpPossibleClasses, setpClasses);
};

function decorateRoomBasedOnTemp() {
    let {tempDOM, roomDOM} = this;
    let tempClasses = ['temp-hvac-off', 'temp-cooling', 'temp-heating'];
    findAndAddAsOnlyClass(tempDOM, roomDOM, tempClasses);
};

function decorateModeView() {
    let {modeDOM} = this;
    let currMode = this.getMode();
    let currModeText = this.getModeText();
    let currModeHTML = this.getModeImgHTML();
    let currModeDOM = modeDOM.html();
    let currModeFullText = `${currModeHTML} ${currModeText}`;
    if (currModeFullText !== currModeDOM) modeDOM.html(currModeFullText);
};

function toggleFanStepButtons() {
    if (this[FAN_MANUAL_GA]) {
        let fanStep = this[FAN_STEP_GA];
        if (fanStep > 0 && fanStep < 5) this.fanStepButtons.show();
        else if (fanStep === 0) this.fanStepButtons.show().filter('.fan-step-minus').hide();
        else if (fanStep === 5) this.fanStepButtons.show().filter('.fan-step-plus').hide();
        else this.fanStepButtons.show();
    } else this.fanStepButtons.hide();
};

        

// plik json z danymi HVAC o tag "hvac"
let hvacData = `[{"tryb":1,"floor":-1,"Setpoint display":7,"Temperatura":29.38,"on\/off":false,"room":"Basen","mode":"P","heating control valve status":false},{"on\/off":false,"room":"Gabinet Pani","mode":"F","Temperatura":24,"tryb":3,"status cooling":false,"Fan coil step":0,"Setpoint display":7,"status heating":false,"fanlevel":0,"floor":1,"Fan coil manual":false},{"on\/off":false,"room":"Gabinet Szefa","mode":"F","Temperatura":23.3,"tryb":3,"status cooling":false,"Fan coil step":0,"Setpoint display":7,"status heating":false,"fanlevel":0,"floor":0,"Fan coil manual":false},{"room":"Garaż","floor":-1,"Temperatura":19.28},{"on\/off":false,"room":"Garderoba","mode":"F","Temperatura":23.04,"tryb":3,"status cooling":false,"Fan coil step":0,"Setpoint display":7,"status heating":false,"fanlevel":0,"floor":1,"Fan coil manual":false},{"on\/off":false,"room":"Gościnny 1","mode":"F","Temperatura":23.9,"tryb":3,"status cooling":false,"Fan coil step":0,"Setpoint display":7,"status heating":false,"fanlevel":0,"floor":1,"Fan coil manual":false},{"on\/off":false,"room":"Gościnny z aneksem","mode":"F","Temperatura":24.54,"tryb":3,"status cooling":false,"Fan coil step":0,"Setpoint display":7,"status heating":false,"fanlevel":0,"floor":1,"Fan coil manual":false},{"room":"Jadalnia","Fan coil step":0,"Setpoint display":7,"Fan coil manual":false,"on\/off":false,"mode":"P+F","Temperatura":25.96,"tryb":3,"status cooling":false,"heating control value current":0,"heating control value":0,"status heating":false,"fanlevel":0,"floor":0,"heating control valve status":false},{"on\/off":false,"room":"Komunikacja 0p","mode":"F","Temperatura":24.32,"tryb":3,"status cooling":false,"Fan coil step":0,"Setpoint display":7,"status heating":false,"fanlevel":0,"floor":0,"Fan coil manual":false},{"on\/off":false,"room":"Komunikacja Ip","mode":"F","Temperatura":24.22,"tryb":3,"status cooling":false,"Fan coil step":0,"Setpoint display":7,"status heating":false,"fanlevel":0,"floor":1,"Fan coil manual":false},{"room":"Kuchnia","Fan coil step":0,"Setpoint display":7,"Fan coil manual":false,"on\/off":false,"mode":"P+F","Temperatura":25.08,"tryb":3,"status cooling":false,"heating control value current":0,"heating control value":0,"status heating":false,"fanlevel":0,"floor":0,"heating control valve status":false},{"room":"Łazienka Państwa","Fan coil step":0,"Setpoint display":7,"Fan coil manual":false,"on\/off":false,"mode":"P+F","Temperatura":24.32,"tryb":3,"status cooling":false,"heating control value current":0,"heating control value":0,"status heating":false,"fanlevel":0,"floor":1,"heating control valve status":false},{"on\/off":false,"mode":"P","Temperatura":23.72,"tryb":3,"room":"Łazienka dla Gości","status heating":false,"Setpoint display":15,"floor":1,"heating control valve status":false},{"on\/off":false,"mode":"P","Temperatura":23,"tryb":3,"room":"Łazienka w Gościnnym","status heating":false,"Setpoint display":15,"floor":1,"heating control valve status":false},{"on\/off":false,"room":"Muzyczny","mode":"F","Temperatura":24.88,"tryb":3,"status cooling":false,"Fan coil step":0,"Setpoint display":7,"status heating":false,"fanlevel":0,"floor":1,"Fan coil manual":false},{"on\/off":false,"room":"Salon","mode":"F","Temperatura":25.42,"tryb":3,"status cooling":false,"Fan coil step":0,"Setpoint display":7,"status heating":false,"fanlevel":0,"floor":0,"Fan coil manual":false},{"on\/off":false,"room":"Sypialnia","mode":"F","Temperatura":24.32,"tryb":3,"status cooling":false,"Fan coil step":0,"Setpoint display":7,"status heating":false,"fanlevel":0,"floor":1,"Fan coil manual":false},{"trybhvac":255}] `;

// MAPOWANIE KOŃCÓWEK ZMIENNYCH NM - NAZWY NP. POKÓJ, GA - KOŃCÓWKA ALIASA
// DOCELOWO PROGRAM ŁĄCZY JE WE WŁAŚCIWY SPOSÓB I POWSTAJE NP. `${ROOM_NM}_${TYPE_NM}_${MODE_GA}` = Jadalnia_P+F_tryb
const STATE_GA = 'on/off';
const ROOM_NM = 'room';
const TYPE_NM = 'mode';
const TEMP_GA = 'Temperatura';
const MODE_GA = 'tryb';
const COOL_GA = 'status cooling';
const FAN_STEP_GA = 'Fan coil step';
const SETP_DISP_GA = 'Setpoint display';
const HEAT_GA = 'status heating';
const FAN_LEVEL_GA = 'fanlevel';
const FLOOR_NM = 'floor';
const FAN_MANUAL_GA = 'Fan coil manual';
const PWM_VALVE_GA = 'heating control valve status';
const NEXT_PWM_GA = 'heating control value';
const PWM_GA = 'heating control value current';

// INNE STAŁE KTÓRE SĄ WYKORZYSTYWANE W PROGRAMIE, ALE NIE MA ICH W OBIEKCIE NP. NEW_SETPOINT
const NEW_SETP_GA = 'New setpoint';
const HVAC_MODE_GA = 'Ogrzewanie_Tryb HVAC';


// Errors
const EMPTY_ZONE = `Nie można zaktualizować strefy, przekazane dane są puste!`;
const EMPTY_ZONES = `Nie można zaktualizować stref, przekazane dane są puste!`;
const MODE_OUT_OF_RANGE = `Przekazana wartość trybu poza zakresem! Zakres wynosi 0 - 5.`;
const FAN_SPEED_OUT_OF_RANGE = `Nowa wartość 'Fan coil speed value' poza zakresem!`;

// HVAC modes
const HVAC_AUTO_MODE = `AUTO: System automatycznie przełącza się pomiędzy grzaniem i chłodzeniem.`;
const HVAC_HEAT_MODE = `TYLKO GRZANIE: Budynek jest w trybie grzania. Nie jest możliwe jednoczesne chłodzenie.`;
const HVAC_COOL_MODE = `TYLKO CHŁODZENIE: Nie jest możliwe jednoczesne grzanie.`;
const HVAC_OFF_MODE = `WYŁĄCZONY: W budynku grzanie i chłodzenie jest wyłączone. System nie pracuje.`;

// MESSAGES
const HVAC_HEAT_CONFIRM = 'Czy na pewno chcesz przełączyć cały system w tryb grzania?';
const HVAC_HEAT_ALERT = 'Budynek już jest w trybie grzania.';
const HVAC_COOL_CONFIRM = 'Czy na pewno chcesz przełączyć cały system w tryb chłodzenia?';
const HVAC_COOL_ALERT = 'Budynek już jest w trybie chłodzenia.';
const HVAC_OFF_CONFIRM = 'Czy na pewno chcesz wyłączyć w całym domu grzanie i chłodzenie?';
const HVAC_OFF_ALERT = 'Grzanie i chłodzenie już jest wyłączone.';


// Po aktualizacji danych wymuś przeliczenie widoku
class Zone {
    constructor(zone) {
        if (!zone) throw new Error(EMPTY_ZONE);
        
        let properties = [
            STATE_GA, ROOM_NM, TYPE_NM, TEMP_GA, MODE_GA, COOL_GA, FAN_STEP_GA, SETP_DISP_GA, HEAT_GA, FAN_LEVEL_GA, FLOOR_NM, FAN_MANUAL_GA, PWM_VALVE_GA, NEXT_PWM_GA, PWM_GA
        ];
        
        this.update = (zone) => properties.forEach(c => {
            if (isNotUndef(zone[c])) this[c] = zone[c];
        });

        // Wypełnianie właściwości obiektu
        this.update(zone);

        let state = this[STATE_GA];
        if (isNotUndef(state)) this.getState = () => this[STATE_GA] ? 'wł' : 'wył';
        
        let room = this[ROOM_NM];
        if (isNotUndef(room)) this.getRoom = () => this[ROOM_NM];

        let temp = this[TEMP_GA];
        if (isNotUndef(temp)) this.getTemp = () => Math.round(this[TEMP_GA]*10)/10;

        let type = this[TYPE_NM];
        if (isNotUndef(type)) this.getType = () => this[TYPE_NM];

        let mode = this[MODE_GA];
        if (isNotUndef(mode)) {
            this.getMode = () => this[MODE_GA];
            this.getModeImgHTML = () => {
                let src = '', alt = '';
                
                switch(this[MODE_GA]) {
                    case 0: src = 'auto.svg'; alt = 'auto'; break;
                    case 1: src = 'comfort.svg'; alt = 'comfort'; break;
                    case 2: src = 'standby.svg'; alt = 'standby'; break;
                    case 3: src = 'eco.svg'; alt = 'eco'; break;
                    case 4: src = 'frost.svg'; alt = 'frost'; break;
                };
                if (src) return `<img class="icon" src="icons/${src}" height="26" width="26" alt="${alt}">`;
                else console.log(MODE_OUT_OF_RANGE);
            };
            this.getModeText = () => {
                let text = '';
                
                switch(this[MODE_GA]) {
                    case 0: text = 'auto'; break;
                    case 1: text = 'komfort'; break;
                    case 2: text = 'standby'; break;
                    case 3: text = 'eko'; break;
                    case 4: text = 'ochrona'; break;
                };
                if (text) return text;
                else console.log(MODE_OUT_OF_RANGE);
            };
        };

        let cooling = this[COOL_GA];
        if (isNotUndef(cooling)) this.getCooling = () => this[COOL_GA] ? 'wł' : 'wył';

        let heating = this[HEAT_GA];
        if (isNotUndef(heating)) this.getHeating = () => this[HEAT_GA] ? 'wł' : 'wył';

        let fanStep = this[FAN_STEP_GA];
        if (isNotUndef(fanStep)) this.getFanStep = () => this[FAN_STEP_GA];

        let setp = this[SETP_DISP_GA];
        if (isNotUndef(setp)) this.getSetp = () => this[SETP_DISP_GA];

        let fanLevel = this[FAN_LEVEL_GA];
        if (isNotUndef(fanLevel)) this.getFanLevel = () => this[FAN_LEVEL_GA];

        let floor = this[FLOOR_NM];
        if (isNotUndef(floor)) this.getFloor = () => this[FLOOR_NM];

        let fanManual = this[FAN_MANUAL_GA];
        if (isNotUndef(fanManual)) this.getFanManual = () => this[FAN_MANUAL_GA] ? 'wł' : 'wył';

        let PWMValve = this[PWM_VALVE_GA];
        if (isNotUndef(PWMValve)) this.getPWMValve = () => this[PWM_VALVE_GA] ? 'wł' : 'wył';

        let PWM = this[PWM_GA];
        if (isNotUndef(PWM)) this.getPWM = () => this[PWM_GA];

        let nextPWM = this[NEXT_PWM_GA];
        if (isNotUndef(nextPWM)) this.getNextPWM = () => this[NEXT_PWM_GA];
    }

    updateStateView(hvacMode) {
        if (!checkIfAllPropertiesExists.call(this, [STATE_GA])) return;
        decorateNormalBoolValue.call(this, this.stateDOM, this[STATE_GA], this.getState(), 'state');
    }

    updateModeView(hvacMode) {
        if (!checkIfAllPropertiesExists.call(this, [MODE_GA])) return;
        decorateModeView.call(this);
    }

    updateTempView(hvacMode) { // ZAWSZE AKTUALIZUJ PO SETP LUB RÓWNIEŻ ZAKTUALIZUJ SETP, ŻEBY POGRÓBIĆ I POKOLOROWAĆ ODPOWIEDNIO
        if (!checkIfAllPropertiesExists.call(this, [TEMP_GA])) return;
        if (!checkIfAllPropertiesExists.call(this, [SETP_DISP_GA])) decorateTempValue.call(this, hvacMode);
        else decorateTempAndSetpValue.call(this, hvacMode);
        decorateRoomBasedOnTemp.call(this);
    }

    updateSetpView(hvacMode) {
        if (!checkIfAllPropertiesExists.call(this, [SETP_DISP_GA])) return;
        decorateTempAndSetpValue.call(this, hvacMode);
        decorateRoomBasedOnTemp.call(this);
    }

    updateHeatingView(hvacMode) {
        if (!checkIfAllPropertiesExists.call(this, [HEAT_GA])) return;
        decorateNormalBoolValue.call(this, this.heatingDOM, this[HEAT_GA], this.getHeating(), 'heat');
    }

    updateCoolingView(hvacMode) {
        if (!checkIfAllPropertiesExists.call(this, [COOL_GA])) return;
        decorateNormalBoolValue.call(this, this.coolingDOM, this[COOL_GA], this.getCooling(), 'cool');
    }

    updateFanStepView(hvacMode) {
        if (!checkIfAllPropertiesExists.call(this, [FAN_STEP_GA])) return;
        decorateHVACValue.call(this, this.fanStepDOM, this[HEAT_GA], this[COOL_GA], this[FAN_STEP_GA], this.getFanStep(), generateClassNameFromStep);
        toggleFanStepButtons.call(this);
    }

    updateFanManualView(hvacMode) {
        if (!checkIfAllPropertiesExists.call(this, [FAN_MANUAL_GA])) return;
        decorateNormalBoolValue.call(this, this.fanManualDOM, this[FAN_MANUAL_GA], this.getFanManual(), 'fan-manual');
        toggleFanStepButtons.call(this);
    }

    updatePWMValveView(hvacMode) {
        if (!checkIfAllPropertiesExists.call(this, [PWM_VALVE_GA])) return;
        decorateNormalBoolValue.call(this, this.PWMValveDOM, this[PWM_VALVE_GA], this.getPWMValve(), 'pwm-valve');
    }

    updatePWMView(hvacMode) {
        if (!checkIfAllPropertiesExists.call(this, [PWM_GA])) return;
        decorateHVACValue.call(this, this.PWMDOM, this[HEAT_GA], this[COOL_GA], this[PWM_GA], this.getPWM(), generateClassNameFromPercent);
    }

    updateNextPWMView(hvacMode) {
        if (!checkIfAllPropertiesExists.call(this, [NEXT_PWM_GA])) return;
        decorateHVACValue.call(this, this.nextPWMDOM, this[HEAT_GA], this[COOL_GA], this[NEXT_PWM_GA], this.getNextPWM(), generateClassNameFromPercent);
    }
};

class HVACManager {
    constructor(tableClassName, url) {
        if (!url) throw new Error(EMPTY_ZONES);
        this.url = url;
        this.zones = [];

        let that = this;
        function initApp(zones) {that.initApp(zones, tableClassName)};
        function updateApp(zones) {that.updateApp(zones)};
        
        $.get(this.url, initApp);
        setInterval(function() {$.get(that.url, updateApp)}, 500);
    }

    initApp(zones, tableClassName) {
        this.updateZones(zones);
        this.generateView(tableClassName);
        this.updateView();
        this.generateLinksToRoom();
    }

    updateApp(zones) {
        this.updateZones(zones);
        this.updateView();
    }

    updateZones(zones) {
        if (typeof zones === 'string') zones = JSON.parse(zones);
        // TWORZY LUB EDYTUJE ISTNIEJĄCĄ STREFĘ NA PODSTAWIE 
        zones.forEach(zone => {
            if (zone.room) {
                let {room} = zone;
                let existingZone = this.zones.find(z => z.room === room);
                if (isNotUndef(existingZone)) existingZone.update(zone);
                else this.zones.push(new Zone(zone));
            } else if (zone.trybhvac) this.hvacMode = zone.trybhvac;
        });
    }

    generateZonesView(tableClassName) { // update zones view
        this.zones.forEach(zone => {
            let row, room, floor, type, state, mode, temp, setp, heating, cooling, fanStep, fanManual, valve, PWM, nextPWM;
            let emptyHTML = `<td class="empty">-</td>`;

            row = $(`<tr></tr>`).appendTo(`${tableClassName} tbody`);
            zone.row = row;

            room = $(`<td class="room">${zone.getRoom()}</td>`).appendTo(row); // PRZEJDŹ DO OGRZEWANIA POKOJU, GDY JESTEŚ W WIZUALIZACJI LM
            zone.roomDOM = room;

            floor = $(`<td class="floor">${zone.getFloor()}</td>`).appendTo(row);
            zone.floorDOM = floor;
            
            if (zone.getType) {
                type = $(`<td class="type">${zone.getType()}</td>`).appendTo(row);
                zone.typeDOM = type;
            } else $(emptyHTML).appendTo(row);
   
            if (zone.getState) {
                state = $(`<td class="state"></td>`).appendTo(row);

                state.on('click', function() {
                    let currState = zone[STATE_GA];
                    grp.write(`${zone.room}_${zone.mode}_${STATE_GA}`, !currState); // WYŚLIJ DO LM
                    zone[STATE_GA] = !currState; // ZAŁOŻENIE POPRAWNEGO ZAKOŃCZENIA ZMIANY
                });

                zone.stateDOM = state;
            } else $(emptyHTML).appendTo(row);

            if (zone.getMode) {
                mode = $(`<td class="mode"></td>`).appendTo(row);

                mode.on('click', function() {
                    let nextMode;
                    let currMode = zone.getMode();

                    if (currMode < 4) nextMode = currMode + 1;
                    else nextMode = 1; // POMIJAM TRYB 0 - AUTO, BO JEST MYLĄCY

                    grp.write(`${zone.room}_${zone.mode}_${MODE_GA}`, nextMode); // WYŚLIJ DO LM
                    zone[MODE_GA] = nextMode; // ZAŁOŻENIE POPRAWNEGO ZAKOŃCZENIA ZMIANY
                });

                zone.modeDOM = mode; // DODAJ WYŚWIETLENIE WYBORU NOWEGO TRYBU
            } else $(emptyHTML).appendTo(row);

            temp = $(`<td class="temp"></td>`).appendTo(row);
            zone.tempDOM = temp;

            if (zone.getSetp) {
                setp = $(`<td class="setp"></td>`).appendTo(row);
                let minus = $(`<i class="fa fa-minus setp-minus"></i>`).appendTo(setp);
                let setpValue = $(`<span class="setp-value"></span>`).appendTo(setp);
                let plus = $(`<i class="fa fa-plus setp-plus"></i>`).appendTo(setp);
                
                function changeSetp(e) { // WYKRYWANIE OSIĄGNIĘCIA TEMP MINIMALNEJ
                    let delta = e.data;
                    let currSetp = zone[SETP_DISP_GA];
                    grp.write(`${zone.room}_${zone.mode}_${NEW_SETP_GA}`, currSetp + delta); // WYŚLIJ DO LM
                    zone[SETP_DISP_GA] = currSetp + delta; // ZAŁOŻENIE POPRAWNEGO ZAKOŃCZENIA ZMIANY
                };

                minus.on('click', -1, changeSetp);
                plus.on('click', 1, changeSetp);
                
                zone.setpButtons = minus.add(plus);
                zone.setpDOM = setpValue;
            } else $(emptyHTML).appendTo(row);

            if (zone.getHeating) {
                heating = $(`<td class="heating"></td>`).appendTo(row);
                zone.heatingDOM = heating;
            } else $(emptyHTML).appendTo(row);

            if (zone.getCooling) {
                cooling = $(`<td class="cooling"></td>`).appendTo(row);
                zone.coolingDOM = cooling;
            } else $(emptyHTML).appendTo(row);

            if (zone.getFanStep) {
                fanStep = $(`<td class="fan-step"></td>`).appendTo(row);
                let minus = $(`<i class="fa fa-minus fan-step-minus"></i>`).appendTo(fanStep);
                let fanStepValue = $(`<span class="fan-step-value"></span>`).appendTo(fanStep);
                let plus = $(`<i class="fa fa-plus fan-step-plus"></i>`).appendTo(fanStep);

                function changeFanStep(e) {
                    let delta = e.data;
                    let currFanStep = zone[FAN_STEP_GA];
                    if (currFanStep + delta < 0 || currFanStep + delta > 5) return console.log(FAN_SPEED_OUT_OF_RANGE); 
                    grp.write(`${zone.room}_${zone.mode}_${FAN_STEP_GA}`, currFanStep + delta); // WYŚLIJ DO LM
                    zone[FAN_STEP_GA] = currFanStep + delta; // ZAŁOŻENIE POPRAWNEGO ZAKOŃCZENIA ZMIANY
                };

                minus.on('click', -1, changeFanStep);
                plus.on('click', 1, changeFanStep);

                zone.fanStepButtons = minus.add(plus);
                zone.fanStepDOM = fanStepValue;
            } else $(emptyHTML).appendTo(row);

            if (zone.getFanManual) {
                fanManual = $(`<td class="fan-manual"></td>`).appendTo(row);

                fanManual.on('click', function() {
                    let currFanManual = zone[FAN_MANUAL_GA];
                    grp.write(`${zone.room}_${zone.mode}_${FAN_MANUAL_GA}`, !currFanManual); // WYŚLIJ DO LM
                    zone[FAN_MANUAL_GA] = !currFanManual; // ZAŁOŻENIE POPRAWNEGO ZAKOŃCZENIA ZMIANY
                });

                zone.fanManualDOM = fanManual;
            } else $(emptyHTML).appendTo(row);

            if (zone.getPWMValve) {
                valve = $(`<td class="pwm-valve"></td>`).appendTo(row);
                zone.PWMValveDOM = valve;
            } else $(emptyHTML).appendTo(row);

            if (zone.getNextPWM) {
                nextPWM = $(`<td class="pwm-next"></td>`).appendTo(row);
                zone.nextPWMDOM = nextPWM;
            } else $(emptyHTML).appendTo(row);

            if (zone.getPWM) {
                PWM = $(`<td class="pwm"></td>`).appendTo(row);
                zone.PWMDOM = PWM;
            } else $(emptyHTML).appendTo(row);
        });
    }

    updateZonesView() {
        this.zones.forEach(zone => {
            let {hvacMode} = this;
            zone.updateStateView(hvacMode);
            zone.updateModeView(hvacMode);
            zone.updateTempView(hvacMode);
            zone.updateSetpView(hvacMode);
            zone.updateHeatingView(hvacMode);
            zone.updateCoolingView(hvacMode);
            zone.updateFanStepView(hvacMode);
            zone.updateFanManualView(hvacMode);
            zone.updatePWMValveView(hvacMode);
            zone.updatePWMView(hvacMode);
            zone.updateNextPWMView(hvacMode);
        });
    }

    generateHVACModeView() {
        let {hvacMode} = this;
        let hvacModeInfo = $('.hvac-mode-info');
        
        // obsługa przełączania trybu hvac - grzanie
        $('.hvac-heat').on('click', function() {
            if (hvacMode === 1) alert(HVAC_HEAT_ALERT);
            else {
                if (confirm(HVAC_HEAT_CONFIRM)) grp.write(HVAC_MODE_GA, 1);
            };
        });
                    
        // obsługa przełączania trybu hvac - chłodzenie
        $('.hvac-cool').on('click', function() {
            if (hvacMode === 3) alert(HVAC_COOL_ALERT);
            else {
                if (confirm(HVAC_COOL_CONFIRM)) grp.write(HVAC_MODE_GA, 3);
            };
        });

        // obsługa przełączania trybu hvac - wył
        $('.hvac-off').on('click', function() {
            if (hvacMode === 255) alert(HVAC_OFF_ALERT);
            else {
                if (confirm(HVAC_OFF_CONFIRM)) grp.write(HVAC_MODE_GA, 255);
            };
        });
    }

    updateHVACModeView() {
        let {hvacMode} = this;
        let hvacModeDOM = $('.hvac-mode');
        let hvacModeInfo = $('.hvac-mode-info');
        let hvacModeClasses = ['hvac-mode-heat', 'hvac-mode-cool', 'hvac-mode-off'];
        let tableHeader = $('table > thead');

        let hvacHeatBtn = $('.hvac-heat');
        let hvacCoolBtn = $('.hvac-cool');
        let hvacOffBtn = $('.hvac-off');
        let hvacAllBtns = hvacHeatBtn.add(hvacCoolBtn).add(hvacOffBtn);

        function activeBtn(btn) {
            removeClass.call(hvacAllBtns, 'active');
            addClass.call(btn, 'active');
        };
        
        let info = '', hvacModeClass = '';
        switch (hvacMode) {
            case 0: info = HVAC_AUTO_MODE; hvacModeClass = 'hvac-mode-auto'; activeBtn(hvacHeatBtn); break;
            case 1: info = HVAC_HEAT_MODE; hvacModeClass = 'hvac-mode-heat'; activeBtn(hvacHeatBtn); break;
            case 3: info = HVAC_COOL_MODE; hvacModeClass = 'hvac-mode-cool'; activeBtn(hvacCoolBtn); break;
            case 255: info = HVAC_OFF_MODE; hvacModeClass = 'hvac-mode-off'; activeBtn(hvacOffBtn); break;
        };
        hvacModeInfo.text(info);
        findAndRemoveFromTable(hvacModeClasses, hvacModeClass);
        addAndRemoveClasses.call(hvacModeDOM.add(tableHeader), hvacModeClasses, hvacModeClass);
    }

    generateView(tableClassName) {
        this.generateZonesView(tableClassName);
        this.generateHVACModeView();
    }

    updateView() {
        this.updateHVACModeView();
        this.updateZonesView();
    }

    generateLinksToRoom() {
        // KLIKNIĘCIE NA NAZWĘ POKOJU PRZENOSI DO NIEGO W WIZUALIZACJI LM
        if (typeof(parent.showPlan)=='function') {
            $('.room').on('click', function() {
                let id, selected = this.innerText;
                let pages = ['Basen', 'Garaż', 'Kuchnia', 'Gabinet Szefa', 'Jadalnia', 'Salon', 'Komunikacja 0p', 'Komunikacja Ip', 'Sypialnia', 'Gabinet Pani', 'Łazienka Państwa', 'Garderoba', 'Gościnny 1', 'Gościnny z aneksem', 'Łazienka w Gościnnym', 'Muzyczny', 'Łazienka dla Gości'];

                let roomIndex = pages.findIndex(v=>v.toLocaleUpperCase()===selected);
                if (roomIndex < 2) id = 152;
                else if (roomIndex < 5) id = 153;
                else if (roomIndex < 7) id = 154;
                else if (roomIndex < 10) id = 155;
                else if (roomIndex < 13) id = 156;
                else if (roomIndex < 17) id = 157;

                if (typeof id === 'number') parent.showPlan(id);
            });
        };
    }
};

let hvacManager = new HVACManager('.controllers', 'hvac_data.lp');
console.log(hvacManager);

// async function fetchAsync () {
//     // await response of fetch call
//     let response = await fetch('/user/hvac_manager/hvac_data.lp');
//     // only proceed once promise is resolved
//     let data = await response.json();
//     // only proceed once second promise is resolved
//     return data;
// };


// WYŚWIETL TEMPERATURĘ AKTUALNĄ, PROGNOZĘ POGODY, INFORMACJĘ O ILE WCZORAJ W NOCY SPADŁA TEMPERATURA POMIĘDZY ZACHODEM SŁOŃCA A WSCHODEM, PROGNOZA POGODY I PREDYKCJA SPADKU DZISIEJSZEJ NOCY PRZY WYŁĄCZONYM OGRZEWANIU, WŁĄCZONYM OGRZEWANIU, PODOBNIE DLA LATA. PONADTO NALEŻY POWIĄZAĆ NAWILŻANIE I REKUPERACJĘ (ZWŁASZCZA POMPĘ CIEPŁA)