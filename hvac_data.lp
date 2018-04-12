<? require("apps")
objects = grp.tag("hvac")

result = {}

for k,v in pairs(objects) do
object = v.name

  if object == "Ogrzewanie_Tryb HVAC" then
    -- gdy jak tryb hvac (zapis w zmiennej, by później zapisać do każdego pokoju)
    tryb_hvac = v.data
  else
  -- gdy inny
  name, variable = object:match('(.-)_(.*)')
  if variable == "Temperatura" then
      -- gdy to temperatura
      if result[name] then result[name]["room"] = name; result[name][variable] = v.data else result[name] = {}; result[name]["room"] = name; result[name][variable] = v.data end
    else
      -- gdy to nie temperatura
    name, mode, variable = object:match('(.*)_(.*)_(.*)')
    if result[name] then result[name]["room"] = name; result[name]["mode"] = mode else result[name] = {}; result[name]["room"] = name; result[name]["mode"] = mode end
      result[name][variable] = v.data
    end
    
  end
  
end

objects = {
  [1] = {"Basen", -1},
  [2] = {"Gabinet Pani", 1},
  [3] = {"Gabinet Szefa", 0},
  [4] = {"Garaż", -1},
  [5] = {"Garderoba", 1},
  [6] = {"Gościnny 1", 1},
  [7] = {"Gościnny z aneksem", 1},
  [8] = {"Jadalnia", 0},
  [9] = {"Komunikacja 0p", 0},
  [10] = {"Komunikacja Ip", 1},
  [11] = {"Kuchnia", 0},
  [12] = {"Łazienka Państwa", 1},
  [13] = {"Łazienka dla Gości", 1},
  [14] = {"Łazienka w Gościnnym", 1},
  [15] = {"Muzyczny", 1},
  [16] = {"Salon", 0},
  [17] = {"Sypialnia", 1}
}

for k,v in ipairs(objects) do
objects[k] = result[v[1]]
objects[k]["room"] = v[1]
objects[k]["floor"] = v[2]
end

objects[18] = {}
objects[18]["trybhvac"] = tryb_hvac

print(json.encode(objects))
?>