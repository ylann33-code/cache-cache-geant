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

let myRole = "cacheur";

let isAdmin = false;

let markers = {};

let gamePhase = "lobby";

const playersList =
document.getElementById(
"playersList"
);

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

document.getElementById(
"foundButton"
).onclick = foundMe;

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
return;
}

navigator.geolocation
.getCurrentPosition(

async position=>{

const code =
randomCode();

const radius =
parseInt(
document.getElementById(
"radiusInput"
).value
);

currentGame = code;
currentPlayer = pseudo;

isAdmin = true;

const lat =
position.coords.latitude;

const lng =
position.coords.longitude;

await set(
ref(db,"games/"+code),
{
admin:pseudo,

phase:"lobby",

radius:radius,

hideTime:300,

center:{
lat:lat,
lng:lng
}
}
);

await addPlayer(
lat,
lng,
"cacheur",
true
);

document.getElementById(
"menu"
).style.display =
"none";

listenGame();

startGPS();

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
return;
}

const snapshot =
await get(
ref(db,"games/"+code)
);

if(!snapshot.exists()){
alert("Partie inexistante");
return;
}

const players =
snapshot.val().players || {};

if(players[pseudo]){
alert("Pseudo déjà pris");
return;
}

currentGame = code;
currentPlayer = pseudo;

navigator.geolocation
.getCurrentPosition(

async position=>{

const lat =
position.coords.latitude;

const lng =
position.coords.longitude;

await addPlayer(
lat,
lng,
"cacheur",
false
);

document.getElementById(
"menu"
).style.display =
"none";

listenGame();

startGPS();

}

);

}

async function addPlayer(
lat,
lng,
role,
admin
){

await set(
ref(
db,
"games/"+currentGame+
"/players/"+currentPlayer
),
{
name:currentPlayer,

role:role,

admin:admin,

lat:lat,
lng:lng,

eliminated:false,

spectator:false
}
);

}

async function startGame(){

if(!isAdmin){
return;
}

await update(
ref(db,"games/"+currentGame),
{
phase:"countdown"
}
);

startCountdown();

}

async function startCountdown(){

let count = 5;

const div =
document.getElementById(
"countdown"
);

div.style.display =
"flex";

const interval =
setInterval(async()=>{

div.innerHTML = count;

count--;

if(count < 0){

clearInterval(interval);

div.style.display =
"none";

await update(
ref(db,"games/"+currentGame),
{
phase:"hiding",

startTime:Date.now()
}
);

startHideTimer();

}

},1000);

}

async function startHideTimer(){

setTimeout(async()=>{

await update(
ref(db,"games/"+currentGame),
{
phase:"playing",

playTime:Date.now()
}
);

},300000);

}

function startGPS(){

navigator.geolocation
.watchPosition(

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
lng:lng
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

gamePhase =
game.phase;

updateUI(game);

updateMap(game);

}

);

}

function updateUI(game){

document.getElementById(
"gameStatus"
).innerHTML =
game.phase;

const players =
game.players || {};

playersList.innerHTML = "";

for(let id in players){

const player =
players[id];

const div =
document.createElement("div");

div.className =
"playerCard";

div.innerHTML =
player.name+
" - "+
player.role;

if(isAdmin){

const cacheur =
document.createElement(
"button"
);

cacheur.innerHTML =
"Cacheur";

cacheur.className =
"roleButton";

cacheur.onclick = ()=>{

changeRole(
player.name,
"cacheur"
);

};

const chercheur =
document.createElement(
"button"
);

chercheur.innerHTML =
"Chercheur";

chercheur.className =
"roleButton";

chercheur.onclick = ()=>{

changeRole(
player.name,
"chercheur"
);

};

div.appendChild(cacheur);

div.appendChild(chercheur);

}

playersList
.appendChild(div);

}

if(
myRole == "cacheur" &&
game.phase == "playing"
){

document.getElementById(
"foundButton"
).style.display =
"block";

}else{

document.getElementById(
"foundButton"
).style.display =
"none";

}

}

async function changeRole(
player,
role
){

await update(
ref(
db,
"games/"+currentGame+
"/players/"+player
),
{
role:role
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
color:"blue"
}
).addTo(map);

map.fitBounds(
zoneCircle.getBounds()
);

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
myRole;

const spectator =
player.spectator;

if(
!isMe &&
!sameRole &&
!spectator &&
!isAdmin
){
continue;
}

let color = "gray";

if(player.role ==
"cacheur"){
color = "green";
}

if(player.role ==
"chercheur"){
color = "red";
}

const marker =
L.circleMarker(
[
player.lat,
player.lng
],
{
radius:8,
color:color
}
).addTo(map);

marker.bindTooltip(
player.name,
{
permanent:true,
direction:"top"
}
);

markers[id] = marker;

checkElimination(
player,
center,
radius
);

}

}

function checkElimination(
player,
center,
radius
){

if(
player.name !=
currentPlayer
){
return;
}

if(gamePhase !=
"playing"){
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

becomeSpectator();

}

}

async function foundMe(){

await becomeSpectator();

}

async function becomeSpectator(){

await update(
ref(
db,
"games/"+currentGame+
"/players/"+currentPlayer
),
{
eliminated:true,
spectator:true
}
);

document.getElementById(
"eliminatedScreen"
).style.display =
"flex";

}
