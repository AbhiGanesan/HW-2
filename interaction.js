
var CSV_FILE = "PSU_ReportedCrimes.csv"; // 
var PSU_CENTER = [40.7982, -77.8599];    // center of PSU campus

// ---------- Map setup ----------
// Create the map inside the #map div and center it on campus
var map = L.map('map').setView(PSU_CENTER, 15);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Scale bar in metric and imperial units
L.control.scale({imperial: true, metric: true}).addTo(map);

// ---------- Offense categories ----------
// Each category has a name, a colored icon (defined in icons.js), and keywords.
// Many rows list several offenses separated by "/", so the categories are checked
// in order and the FIRST category with a matching keyword is used.
var categories = [
  { name: "Violent/Threats",   icon: redIcon,    keys: ["Assault", "Rape", "Robbery", "Threats", "Harassment"] },
  { name: "Theft/Burglary",    icon: orangeIcon, keys: ["Theft", "Burglary", "Stolen"] },
  { name: "Alcohol/Drugs",     icon: greenIcon,  keys: ["Intox Bev", "Drunkenness", "Marijuana", "Drug", "Paraphernalia"] },
  { name: "Vandalism/Trespass",icon: violetIcon, keys: ["Mischief", "Trespass"] },
  { name: "Vehicle",           icon: blueIcon,   keys: ["Vehicle Code"] },
  { name: "Health/Assistance", icon: yellowIcon, keys: ["Health and Safety", "RFA"] },
  { name: "Other",             icon: greyIcon,   keys: [] } // default when nothing matches
];

// Pick the category for an offenses string using String.includes()
function categorize(offenses) {
  for (var i = 0; i < categories.length; i++) {
    for (var j = 0; j < categories[i].keys.length; j++) {
      if (offenses.includes(categories[i].keys[j])) {
        return categories[i];
      }
    }
  }
  return categories[categories.length - 1]; // "Other"
}

// One layer group per category so the legend can show or hide them (bonus filter)
var groups = {};
categories.forEach(function (c) {
  groups[c.name] = L.layerGroup().addTo(map);
});


// Read as text first so the code works whether the file is comma or tab separated
d3.text(CSV_FILE, function (error, text) {
  if (error) { console.error("Could not load " + CSV_FILE, error); return; }

  var firstLine = text.split("\n")[0];
  var delimiter = firstLine.indexOf("\t") >= 0 ? "\t" : ",";
  var rows = d3.dsv(delimiter, "text/plain").parse(text);

  rows.forEach(function (d) {
    var lat = parseFloat(d.Latitude);
    var lng = parseFloat(d.Longitude);
    if (isNaN(lat) || isNaN(lng)) { return; } // skip rows with no coordinates

    var cat = categorize(d.Offenses);

    // Popup format: "What happened (Building)"
    var popupText = d.Content + " (" + d.Location + ")";

    L.marker([lat, lng], { icon: cat.icon })
      .bindPopup(popupText)
      .addTo(groups[cat.name]);
  });
});

// ---------- Legend that also filters (bonus) ----------
var legend = L.control({ position: 'bottomright' });
legend.onAdd = function () {
  var div = L.DomUtil.create('div', 'legend');
  div.innerHTML = '<b>Offenses</b>';
  categories.forEach(function (c) {
    div.innerHTML += '<label><input type="checkbox" checked data-cat="' + c.name + '">' +
      '<img src="' + c.icon.options.iconUrl + '" height="18"> ' + c.name + '</label>';
  });
  L.DomEvent.disableClickPropagation(div);
  // Checking or unchecking a box adds or removes that category's markers
  div.querySelectorAll('input').forEach(function (box) {
    box.addEventListener('change', function (e) {
      var g = groups[e.target.getAttribute('data-cat')];
      if (e.target.checked) { map.addLayer(g); } else { map.removeLayer(g); }
    });
  });
  return div;
};
legend.addTo(map);
