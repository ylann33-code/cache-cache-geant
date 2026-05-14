import { db } from "./firebase.js";

import {
    ref,
    set,
    onValue,
    update
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

let map;
let myMarker;
let zoneCircle;

let currentGame = null;
let currentPlayer = null;
let currentRole = null;

const info = document.getElementById("info");

function randomCode(){

    return Math.random()
    .toString(36)
    .substring(2,8)
    .toUpperCase();

}

map = L.map('map').setView([44.755,-0.53],13);

L.tileLayer(
'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
{
    attribution:'© OpenStreetMap'
}
).addTo(map);

document.getElementById("createGame")
.onclick = createGame;

document.getElementById("joinGame")
.onclick = joinGame;

async function createGame(){

    const pseudo =
    document.getElementById("playerName").value;

    if(pseudo == ""){
        alert("Entre un pseudo");
        return;
    }

    const code = randomCode();

    currentGame = code;
    currentPlayer = pseudo;
    currentRole = "admin";

    const gameRef =
    ref(db,"games/"+code);

    await set(gameRef,{
        center:{
            lat:44.755,
            lng:-0.53
        },
        radius:1000
    });

    addPlayer();

    info.innerHTML =
    "Partie créée : "+code;

    startGPS();

    listenPlayers();

}

async function joinGame(){

    const pseudo =
    document.getElementById("playerName").value;

    const code =
    document.getElementById("gameCode").value;

    if(pseudo == "" || code == ""){
        alert("Complète les champs");
        return;
    }

    currentGame = code;
    currentPlayer = pseudo;

    const role =
    prompt("Role ? cacheur ou chercheur");

    currentRole = role;

    addPlayer();

    info.innerHTML =
    "Connecté à : "+code;

    startGPS();

    listenPlayers();

}

async function addPlayer(){

    const playerRef =
    ref(
        db,
        "games/"+currentGame+
        "/players/"+currentPlayer
    );

    await set(playerRef,{

        name:currentPlayer,

        role:currentRole,

        lat:0,
        lng:0,

        eliminated:false

    });

}

function startGPS(){

    navigator.geolocation.watchPosition(

        position=>{

            const lat =
            position.coords.latitude;

            const lng =
            position.coords.longitude;

            updatePosition(lat,lng);

        },

        error=>{

            alert("GPS refusé");

        },

        {
            enableHighAccuracy:true
        }

    );

}

async function updatePosition(lat,lng){

    const playerRef =
    ref(
        db,
        "games/"+currentGame+
        "/players/"+currentPlayer
    );

    await update(playerRef,{

        lat:lat,
        lng:lng

    });

}

function listenPlayers(){

    const playersRef =
    ref(db,"games/"+currentGame+"/players");

    onValue(playersRef,(snapshot)=>{

        const data = snapshot.val();

        updateMap(data);

    });

}

let markers = {};

function updateMap(players){

    for(let key in markers){

        map.removeLayer(markers[key]);

    }

    markers = {};

    for(let id in players){

        const player = players[id];

        if(player.eliminated){
            continue;
        }

        const sameRole =
        player.role == currentRole;

        const isMe =
        player.name == currentPlayer;

        const isAdmin =
        currentRole == "admin";

        if(!sameRole && !isMe && !isAdmin){
            continue;
        }

        const marker =
        L.marker([player.lat,player.lng])
        .addTo(map);

        marker.bindPopup(
            player.name+
            " ("+player.role+")"
        );

        markers[id] = marker;

    }

    checkZone(players[currentPlayer]);

}

function checkZone(player){

    if(!player){
        return;
    }

    const centerLat = 44.755;
    const centerLng = -0.53;

    if(zoneCircle){
        map.removeLayer(zoneCircle);
    }

    zoneCircle =
    L.circle([centerLat,centerLng],{

        radius:1000,
        color:'blue'

    }).addTo(map);

    const distance =
    map.distance(
        [player.lat,player.lng],
        [centerLat,centerLng]
    );

    if(distance > 1000){

        eliminatePlayer();

    }

}

async function eliminatePlayer(){

    const playerRef =
    ref(
        db,
        "games/"+currentGame+
        "/players/"+currentPlayer
    );

    await update(playerRef,{

        eliminated:true

    });

    alert("Tu es éliminé");

}
