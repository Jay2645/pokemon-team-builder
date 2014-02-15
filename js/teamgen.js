exports = {};
var weaknesses = {};
	
var POKE_TYPES = 
[
	"Normal",
	"Fighting",
	"Flying",
	"Poison",
	"Ground",
	"Rock",
	"Bug",
	"Ghost",
	"Steel",
	"Fire",
	"Water",
	"Grass",
	"Electric",
	"Psychic",
	"Ice",
	"Dragon",
	"Dark",
	"Fairy"
];

var POKE_FORMES = 
[
	["rotom-w", "rotomwash"],
	["rotom-h", "rotomheat"],
	["rotom-f", "rotomfrost"],
	["rotom-c", "rotommow"],
	["rotom-s", "rotomfan"],
	["deoxys-a", "deoxysattack"],
	["deoxys-d", "deoxysdefense"],
	["deoxys-s", "deoxysspeed"],
	["giratina-o", "giratinaorigin"],
	["kyurem-b", "kyuremblack"],
	["kyurem-w", "kyuremwhite"]
];

var SPECIAL_ABILITIES = 
{
	Levitate: [["Ground",0]],
	FlashFire: [["Fire",0]],
	SapSipper: [["Grass",0]],
	WonderGuard: [["Normal",0], ["Fighting",0], ["Poison", 0], ["Ground", 0], ["Bug", 0],["Steel", 0],["Water", 0],["Grass", 0],["Electric", 0],["Psychic", 0],["Ice", 0],["Dragon", 0],["Fairy", 0]],
	DrySkin: [["Water",0], ["Fire", 2]],
	Heatproof: [["Fire", 0.5]],
	ThickFat: [["Fire", 0.5], ["Ice", 0.5]],
	WaterAbsorb: [["Water", 0]]
};

function showPokemon()
{
	var poke = [];
	weaknesses = {};
	// Clear table
	$("#pokeBody").empty();
	var out = document.getElementById("pokeBody");
	
	// Populate poke array with all Pokemon input boxes, trimming out dashes and spaces
	poke[0] = $("#poke0").val().toLowerCase();
	poke[1] = $("#poke1").val().toLowerCase();
	poke[2] = $("#poke2").val().toLowerCase();
	poke[3] = $("#poke3").val().toLowerCase();
	poke[4] = $("#poke4").val().toLowerCase();
	poke[5] = $("#poke5").val().toLowerCase();
	
	// Correct syntax on different Formes
	for(var i = 0; i < poke.length; i++)
	{
		if(!poke[i])
			continue;
		// Mega Pokemon
		var substr = poke[i].substring(0, 5);
		if(substr == "mega " || substr == "mega-")
		{
			poke[i] = poke[i].substring(5, poke[i].length) + "mega";
		}
		
		// Others
		for(var j = 0; j < POKE_FORMES.length; j++)
		{
			var forme = POKE_FORMES[j];
			if(poke[i] == forme[0])
			{
				poke[i] = forme[1];
				break;
			}
		}
	}
	
	// Iterate through each Pokemon box
	for(var i = 0; i < poke.length; i++)
	{
		// Continue if box is empty
		if(!poke[i])
			continue;
		poke[i] = poke[i].replace('-', '').replace(' ', '');
		var mon = exports.BattlePokedex[poke[i]];
		// Continue if the Pokemon cannot be found
		if(!mon)
			continue;
		// Get abilities
		var abilities = mon.abilities;
		
		// Check to see if it has an ability which causes the Pokemon to be immune to a type
		// If so, give user way to specify that the Pokemon has that ability
		for(var ability in SPECIAL_ABILITIES)
		{
			var abilityStr = ability.replace(/([a-z])([A-Z])/g, '$1 $2');
			if(hasAbility(abilities, abilityStr))
			{
				$("#poke"+i+ability).show();
			}
			else
			{
				$("#poke"+i+ability+"Box").prop("checked", false); 
				$("#poke"+i+ability).hide();
			}
		}
		
		// Get Pokemon types
		var types = mon.types;
		var damageTaken = {};
		// Create output row
		var row = document.createElement('tr');
		
		// Check type effectiveness
		// Special case: Ditto
		if(mon.species == "Ditto")
		{
			for(var t in POKE_TYPES)
			{
				damageTaken[POKE_TYPES[t]] = "?";
			}
		}
		else
		{	
			// Check weaknesses/resists
			var damageTaken = typeWeakness(types);
			// Modify the weakness/resistance table to compensate for changes based on ability
			for(var ability in SPECIAL_ABILITIES)
			{
				if($("#poke"+i+ability+"Box").is(":checked"))
				{
					var types = SPECIAL_ABILITIES[ability];
					for(var j = 0; j < types.length; j++)
					{
						var typeMod = types[j];
						damageTaken[typeMod[0]] *= typeMod[1];
					}
				}
			}
		}
		
		// Populate table 
		// Species name
		var speciesCell = document.createElement('th');
		var speciesText = document.createTextNode(mon.species);
		speciesCell.appendChild(speciesText);
		row.appendChild(speciesCell);
		
		// Type modifications
		for(var j = 0; j < POKE_TYPES.length; j++)
		{
			if(weaknesses[POKE_TYPES[j]] == undefined)
			{
				weaknesses[POKE_TYPES[j]] = 0;
			}
			var cell = document.createElement('td');
			var damage = damageTaken[POKE_TYPES[j]];
			var text = document.createTextNode(damage);
			cell.appendChild(text);
			
			if(damage !== "?")
			{
				// Color text based on damage amount
				if(damage < 1)
				{
					if(damage < 0.5)
					{
						weaknesses[POKE_TYPES[j]] -= 2; // This "scores" the total damage thus far
					}
					else
					{
						weaknesses[POKE_TYPES[j]]--;
					}
				}
				else if(damage == 2)
				{
					weaknesses[POKE_TYPES[j]]++;
					cell.className = 'error';
				}
				else if(damage > 2)
				{
					weaknesses[POKE_TYPES[j]] += 2;
					cell.className = 'error';
				}
			}
			row.appendChild(cell);
		}
		out.appendChild(row);
	}
	if(weaknesses[POKE_TYPES[0]] == undefined)
	{
		return;
	}
	// Calculate total weakness/resist chart
	var totalRow = document.createElement('tr');
	var resultCell = document.createElement('th');
	var resultText = document.createTextNode("Total");
	resultCell.appendChild(resultText);
	totalRow.appendChild(resultCell);
	for(var i = 0; i < POKE_TYPES.length; i++)
	{	
		var cell = document.createElement('td');
		var weakness = weaknesses[POKE_TYPES[i]];
		var text = document.createTextNode(weakness);
		if(weakness > 0)
		{
			cell.className = 'error';
		}
		cell.appendChild(text);
		totalRow.appendChild(cell);
	}
	out.appendChild(totalRow)
	$("#possibleMons").html("");
	$('#output').show();
}

function sortBST(pokeList)
{
	var sortedList = [];
	for(var i = 0; i < pokeList.length; i++)
	{
		var pokemon = pokeList[i];
		var baseStats = pokemon.baseStats;
		var baseStatTotal = 0;
		for(var stat in baseStats)
		{
			baseStatTotal += baseStats[stat];
		}
		var pokeBST = [pokemon.species, baseStatTotal];
		console.log(pokemon.species+", "+baseStatTotal);
		sortedList.push(pokeBST);
	}
	sortedList = sortedList.sort(function(a,b) { return b[1] - a[1] });
	for(var i = 0; i < sortedList.length; i++)
	{
		console.log(sortedList[i][0]);
		console.log(sortedList[i][1]);
	}
	return sortedList;
}

function hasAbility(abilityArray,ability)
{
	for(var a in abilityArray)
	{
		if(abilityArray[a] == ability)
		{
			return true;
		}
	}
	return false;
}

function effectiveness(attacker, defender)
{
	var typeChart = exports.BattleTypeChart[defender];
	if(!typeChart)
	{
		return;
	}
	var damageTaken = typeChart.damageTaken;
	var showdownCode = damageTaken[attacker];
	// Convert from Showdown type weakness code to actual
	if(showdownCode == 0) // Neutral
	{
		return 1;
	}
	else if(showdownCode == 1) // Super-effective
	{
		return 2;
	}
	else if(showdownCode == 2) // Not very effective
	{
		return 0.5;
	}
	else // No effect
	{
		return 0;
	}
}

function findWeakTypes()
{
	var weakTypes = [];
	var neutralTypes = [];
	for(var weakness in weaknesses)
	{
		if(weaknesses[weakness] > 0)
		{
			weakTypes.push(weakness);
		}
		else if(weaknesses[weakness] == 0)
		{
			neutralTypes.push(weakness);
		}
	}
	var resistMons = resistsTypes(weakTypes, neutralTypes);
	var resistString = "";
	if(resistMons.length == 0)
	{
		resistString += "No single Pokemon can resist all the types your team is weak to!</br>";
		resistMons = resistsTypes(weakTypes, []);
		resistMons = sortBST(resistMons);
		if(resistMons.length > 0)
		{
			resistString += "However, these Pokemon came the closest:</br><ul>";
			for(var i = 0; i < resistMons.length; i++)
			{
				var resistMon = resistMons[i];
				resistString += "<li>" + resistMon[0] + "</li>";
			}
			resistString += "</ul>";
		}
	}
	else
	{
		resistString += "These Pokemon compliment your team:</br><ul>";
		resistMons = sortBST(resistMons);
		for(var i = 0; i < resistMons.length; i++)
		{
			var resistMon = resistMons[i];
			resistString += "<li>" + resistMon[0] + "</li>";
		}
		resistString += "</ul>";
	}
	
	$("#possibleMons").html(resistString);
}

function resistsTypes(types, neutralTypes)
{
	var pokedex = exports.BattlePokedex;
	var resistMons = [];
	for(var poke in pokedex)
	{
		pokemon = pokedex[poke];
		if(pokemon.num <= 0)
			continue;
		var resists = true;
		for(var j = 0; j < types.length; j++)
		{
			var type = types[j];
			if(!doesResist(pokemon, type))
			{
				resists = false;
				break;
			}
		}
		if(resists)
		{
			for(var j = 0; j < neutralTypes.length; j++)
			{
				if(weakTo(pokemon, neutralTypes[j]))
				{
					resists = false;
					break;
				}
			}
			if(resists)
			{
				resistMons.push(pokemon);
			}
		}
	}
	return resistMons;
}

function weakTo(pokemon, type)
{
	var monWeaknesses = pokemonWeakness(pokemon);
	return monWeaknesses[type] > 1;
}

function doesResist(pokemon, type)
{
	var monWeaknesses = pokemonWeakness(pokemon);
	return monWeaknesses[type] < 1;
}

function pokemonWeakness(pokemon)
{
	var mon = {};
	if(!pokemon.species)
	{
		mon = exports.BattlePokedex[name];
	}
	else
	{
		mon = pokemon;
	}
	// Pokemon cannot be found
	if(!mon)
		return;
	var types = mon.types;
	var weaknesses = typeWeakness(types);
	var abilities = mon.abilities;
	// Find ability-related immunities
	for(var i = 0; i < abilities.length; i++)
	{
		for(var ability in SPECIAL_ABILITIES)
		{
			var ability = SPECIAL_ABILITIES[ability];
			if(abilities[i] == ability)
			{
				for(var j = 0; j < types.length; j++)
				{
					var typeMod = types[j];
					weaknesses[typeMod[0]] *= typeMod[1];
				}
			}
		}
	}
	return weaknesses;
}

function typeWeakness(types)
{
	var typeEffectiveness = [];
	for(var i = 0; i < types.length; i++)
	{
		var typeEffective = {};
		// Iterate through list of all types
		for(var j = 0; j < POKE_TYPES.length; j++)
		{
			// Assign weakness modifier to each type
			var currentType = POKE_TYPES[j];
			typeEffective[currentType] = effectiveness(currentType, types[i]);
		}
		typeEffectiveness[i] = typeEffective;
	}
	
	// Check weaknesses/resists for muli-type Pokemon
	var damageTaken = {};
	if(typeEffectiveness.length > 1)
	{
		var firstTypeEffect = typeEffectiveness[0];
		for(var i = 0; i < POKE_TYPES.length; i++)
		{
			var t = POKE_TYPES[i];
			var secondTypeEffect = typeEffectiveness[1];
			damageTaken[t] = firstTypeEffect[t] * secondTypeEffect[t];
		}
	}
	else
	{
		damageTaken = typeEffectiveness[0];
	}
	return damageTaken;
}

$(document).ready(function()
{
	var typeList = $("#typeList");
	for (var i = 0; i < POKE_TYPES.length; i++)
	{
		typeList.append("<th>"+POKE_TYPES[i]+"</th>");
	}
});