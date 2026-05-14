import { db } from "./firebase.js";

import {
ref,
set,
update,
onValue,
get
}
from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

let map;
let zoneCircle;

let currentGame = null;
let currentPlayer = null;
let currentRole = null;

let started = false;

let markers = {};

const info =
document.getElementById("info");

map = L.map('map')
.setView([48.8566,2.3522],13);

L.tileLayer(
'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
{
attribution:'© OpenStreetMap'
}
).addTo(map);

document.getElementById(
"createGame"
).onclick = createGame;

document.getElementById(
"joinGame"
).onclick = joinGame;

document.getElementById(
"startGame"
).onclick = startGame;

function randomCode(){

return Math.random()
.toString(36)
.substring(2,8)
.toUpperCase();

}

function secureName(name){

return name
.replace(/[^a-zA-Z0-9]/g,"")
.substring(0,12);

}

async function createGame(){

const pseudo =
secureName(
document.getElementById(
"playerName"
).value
);

if(pseudo == ""){
alert("Pseudo invalide");
return;
}

navigator.geolocation.getCurrentPosition(

async position=>{

const code = randomCode();

const radius =
parseInt(
document.getElementById(
"radiusInput"
).value
);

currentGame = code;
currentPlayer = pseudo;
currentRole = "admin";

const lat =
position.coords.latitude;

const lng =
position.coords.longitude;

await set(
ref(db,"games/"+code),
{
admin:pseudo,

started:false,

radius:radius,

center:{
lat:lat,
lng:lng
}
}
);

await addPlayer(lat,lng);

info.innerHTML =
"Code : "+code;

listenGame();

startGPS();

},

()=>{
alert("GPS refusé");
}

);

}

async function joinGame(){

const pseudo =
secureName(
document.getElementById(
"playerName"
).value
);

const code =
document.getElementById(
"gameCode"
).value
.toUpperCase();

if(pseudo == ""){
alert("Pseudo invalide");
return;
}

const snapshot =
await get(
ref(db,
"games/"+code
)
);

if(!snapshot.exists()){

alert("Partie inexistante");
return;

}

const players =
snapshot.val().players || {};

if(players[pseudo]){

alert("Pseudo déjà utilisé");
return;

}

currentGame = code;
currentPlayer = pseudo;

currentRole =
prompt(
"Role : cacheur ou chercheur"
);

navigator.geolocation.getCurrentPosition(

async position=>{

const lat =
position.coords.latitude;

const lng =
position.coords.longitude;

await addPlayer(lat,lng);

listenGame();

startGPS();

},

()=>{
alert("GPS refusé");
}

);

}

async function addPlayer(lat,lng){

await set(
ref(
db,
"games/"+currentGame+
"/players/"+currentPlayer
),
{
name:currentPlayer,

role:currentRole,

lat:lat,
lng:lng,

eliminated:false,

lastUpdate:Date.now()
}
);

}

async function startGame(){

if(currentRole != "admin"){
return;
}

await update(
ref(db,"games/"+currentGame),
{
started:true
}
);

}

function startGPS(){

navigator.geolocation.watchPosition(

async position=>{

const lat =
position.coords.latitude;

const lng =
position.coords.longitude;

await update(
ref(
db,
"games/"+currentGame+
"/players/"+currentPlayer
),
{
lat:lat,
lng:lng,
lastUpdate:Date.now()
}
);

},

()=>{},

{
enableHighAccuracy:true,
maximumAge:5000,
timeout:10000
}

);

}

function listenGame(){

onValue(

ref(db,"games/"+currentGame),

snapshot=>{

const game =
snapshot.val();

if(!game){
return;
}

started = game.started;

updateMap(game);

}

);

}

function updateMap(game){

for(let key in markers){

map.removeLayer(markers[key]);

}

markers = {};

const center =
game.center;

const radius =
game.radius;

if(zoneCircle){

map.removeLayer(zoneCircle);

}

zoneCircle =
L.circle(
[
center.lat,
center.lng
],
{
radius:radius,
color:'blue'
}
).addTo(map);

const players =
game.players || {};

for(let id in players){

const player =
players[id];

if(player.eliminated){

continue;

}

const isMe =
player.name ==
currentPlayer;

const sameRole =
player.role ==
currentRole;

const isAdmin =
currentRole ==
"admin";

if(
!isMe &&
!sameRole &&
!isAdmin
){
continue;
}

let color = "blue";

if(player.role ==
"cacheur"){
color = "green";
}

if(player.role ==
"chercheur"){
color = "red";
}

if(player.role ==
"admin"){
color = "yellow";
}

const marker =
L.circleMarker(
[
player.lat,
player.lng
],
{
radius:10,
color:color
}
).addTo(map);

marker.bindPopup(
player.name+
" ("+
player.role+
")"
);

markers[id] = marker;

if(
player.name ==
currentPlayer
){

checkElimination(
player,
center,
radius
);

}

}

}

function checkElimination(
player,
center,
radius
){

if(!started){
return;
}

const distance =
map.distance(
[
player.lat,
player.lng
],
[
center.lat,
center.lng
]
);

if(distance > radius){

eliminatePlayer();

}

}

async function eliminatePlayer(){

await update(
ref(
db,
"games/"+currentGame+
"/players/"+currentPlayer
),
{
eliminated:true
}
);

document.getElementById(
"eliminatedScreen"
).style.display =
"flex";

}
