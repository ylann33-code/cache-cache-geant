// Création de la carte
const map = L.map('map').setView([44.755, -0.530], 13);

// Carte OpenStreetMap
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

// Cercle de jeu
const zone = L.circle([44.755, -0.530], {
    radius: 1000,
    color: 'blue',
    fillColor: '#3399ff',
    fillOpacity: 0.2
}).addTo(map);