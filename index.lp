<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge,chrome=1">
    <title>HVAC manager</title>
    <meta name="description" content="Manager systemu HVAC" />
    <link rel="Shortcut icon" href="icon.svg" />
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="/apps/css/font-awesome.css">
    <link href='http://fonts.googleapis.com/css?family=Alegreya+Sans&subset=latin,latin-ext' rel='stylesheet' type='text/css'>
    <script src="/apps/js/jquery.js.gz"></script>
    <script src="/apps/js/localbus.js.gz"></script>
    <script src="/scada/vis/busdecode.js.gz"></script>
</head>
<body>
    <?require('apps')?>
    <div class="table">
        <table class="controllers">
            <thead><tr><th rowspan="2">Strefa</th><th rowspan="2">Poziom</th><th rowspan="2">Typ</th><th rowspan="2">Status</th><th rowspan="2">Tryb</th><th colspan="2">Temperatura</th> <th colspan="4">Wentylator</th> <th colspan="3">Podłogówka</th></tr>
                <tr><th>akt</th><th>zad</th> <th>grz</th><th>chł</th><th>stopień</th><th>ręcz</th> <th>grz</th><th>pwm</th><th>pwm_n</th></tr></thead>
            <tbody></tbody>
        </table>
    </div>
    <div class="hvac-mode">
        <div class="hvac-mode-info"></div>
        <input type="button" class="hvac-off" value="wył"/>
        <input type="button" class="hvac-cool" value="chł"/>
        <input type="button" class="hvac-heat" value="grz"/>
    </div>

    <script>
        // inicjalizacja komunikacji z magistralą
        localbus.init();
        
        let grp = {
            help : "This object has a few functions which are helpful for reading, writing values from/to groupaddress.",
            alias : function(alias) {
                // reading data and generates a table with aliases
                let aliases = <? objects = grp.tag({"hvac", "hvac_com"})
                alias = {}
                -- wygenerowanie tabeli ga należących do aliasów
                for k,v in pairs(objects) do
                    alias[k] = {}
                    alias[k][v.name] = v.address
                end
                print(json.encode(alias))?>
                
                let obj = aliases.find(v => isNotUndef(v[alias]));
                if (obj[alias]) return obj[alias];
            },
            write: function(alias, value) {
                // jeśli alias zawiera 3 wystąpienia "/" to jest to adres grupowy i konwersja jest niepotrzebna
                let groupaddr = grp.isGA(alias) ? alias : grp.alias(alias);
                localbus.write(groupaddr, value);
            },
            isGA: v => v.match(/\d+\u002f\d+\u002f\d+/g)
        };
    </script>
    <script src="index.js"></script>
</body>
</html>