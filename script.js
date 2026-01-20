// --- Configuración ---
const names = [
    "Alex", "Sam", "Charlie", "Taylor", "Jordan", 
    "Casey", "Jamie", "Riley", "Morgan", "Avery"
];

const rolesList = [
    "killer", "doctor", 
    "citizen", "citizen", "citizen", "citizen", 
    "citizen", "citizen", "citizen", "citizen"
];

let players = [];
let selectedPlayerId = null;
let turn = 1;
let isGameOver = false;
let investigationsLeft = 1;

// --- Inicialización ---
function initGame() {
    const board = document.getElementById('board');
    board.innerHTML = "";
    
    rolesList.sort(() => Math.random() - 0.5);

    for (let i = 0; i < names.length; i++) {
        players.push({
            id: i,
            name: names[i],
            role: rolesList[i],
            isAlive: true,
            isRevealed: false
        });

        const card = document.createElement('div');
        card.className = 'card';
        card.id = `card-${i}`;
        card.onclick = () => selectCard(i);
        
        card.innerHTML = `
            <span class="avatar">👤</span>
            <div class="name">${names[i]}</div>
            <div class="status" id="status-${i}">Desconocido</div>
        `;
        board.appendChild(card);
    }
    log(`El juego ha comenzado. Tienes ${names.length} sospechosos.`);
}

// --- UI ---
function selectCard(id) {
    if (isGameOver || !players[id].isAlive) return;

    document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
    document.getElementById(`card-${id}`).classList.add('selected');
    selectedPlayerId = id;

    const player = players[id];

    if (!isGameOver) {
        document.getElementById('btn-inv').disabled = (investigationsLeft === 0) || player.isRevealed;

        if (player.isRevealed && player.role !== 'killer') {
             document.getElementById('btn-arr').disabled = true;
        } else {
             document.getElementById('btn-arr').disabled = false;
        }
    }
}

function log(msg) {
    const box = document.getElementById('log-box');
    box.innerHTML += `<div>> ${msg}</div>`;
    box.scrollTop = box.scrollHeight;
}

// --- Acciones Detective ---
function investigate() {
    if (selectedPlayerId === null || investigationsLeft === 0 || isGameOver) return;

    const player = players[selectedPlayerId];
    player.isRevealed = true;
    investigationsLeft--;

    const statusEl = document.getElementById(`status-${selectedPlayerId}`);
    let roleName = "Ciudadano 😐";
    if (player.role === 'killer') roleName = "ASESINO 🔪";
    if (player.role === 'doctor') roleName = "Doctor 💊";

    statusEl.innerHTML = roleName;
    statusEl.style.color = player.role === 'killer' ? '#ff0055' : '#00f2ea';
    
    log(`Has investigado a ${player.name}. Resulta ser: ${roleName}`);
    
    // Bloqueos de botones
    document.getElementById('btn-inv').disabled = true;
    if (player.role !== 'killer') {
        document.getElementById('btn-arr').disabled = true;
    }

    // --- NUEVA LÓGICA: VICTORIA POR DESCARTE ---
    // Contamos cuántos vivos quedan SIN revelar
    const unrevealedSurvivors = players.filter(p => p.isAlive && !p.isRevealed);
    
    // Si solo queda 1 persona viva sin revelar, y esa persona es el Asesino...
    if (unrevealedSurvivors.length === 1 && unrevealedSurvivors[0].role === 'killer') {
        // ¡Victoria Automática!
        // NOTA: Si REALMENTE querías que dijera "Perdiste", cambia el 'true' por 'false' y cambia el mensaje.
        endGame(true, `¡Jaque Mate! Has investigado a todos los inocentes. Por descarte, ${unrevealedSurvivors[0].name} es el Asesino.`);
        return; 
    }
    // --------------------------------------------
    
    document.getElementById('btn-next').style.display = 'inline-block';
}

function arrest() {
    if (selectedPlayerId === null || isGameOver) return;
    const player = players[selectedPlayerId];

    if (player.isRevealed && player.role !== 'killer') return;

    if (player.role === 'killer') {
        endGame(true, `¡Excelente! Arrestaste a ${player.name} y era el Asesino.`);
    } else {
        endGame(false, `¡Error! Arrestaste a ${player.name}, pero era inocente. El asesino escapó.`);
    }
}

// --- Lógica Noche ---
function nextDay() {
    if (isGameOver) return;

    document.getElementById('btn-next').style.display = 'none';
    
    log("--- CAE LA NOCHE ---");

    const doctor = players.find(p => p.role === 'doctor' && p.isAlive);
    let savedId = null;
    if (doctor) {
        const living = players.filter(p => p.isAlive);
        const saved = living[Math.floor(Math.random() * living.length)];
        savedId = saved.id;
    }

    const killer = players.find(p => p.role === 'killer');
    if (killer && killer.isAlive) {
        const targets = players.filter(p => p.isAlive && p.id !== killer.id);
        if (targets.length > 0) {
            const victim = targets[Math.floor(Math.random() * targets.length)];
            
            if (victim.id === savedId) {
                log(`El Asesino atacó a ${victim.name}, ¡pero el Doctor lo salvó!`);
            } else {
                killPlayer(victim.id);
                log(`☠️ ¡Han encontrado el cuerpo de ${victim.name}!`);
            }
        }
    }

    checkWinCondition();

    if (isGameOver) return;

    investigationsLeft = 1;
    if (selectedPlayerId !== null) {
        selectCard(selectedPlayerId); 
    } else {
        document.getElementById('btn-inv').disabled = false;
    }
    
    log(`--- DÍA ${++turn} ---`);
    log("Investiga o arresta a alguien.");
}

function killPlayer(id) {
    players[id].isAlive = false;
    const card = document.getElementById(`card-${id}`);
    card.classList.add('dead');
    card.classList.remove('selected');
    document.getElementById(`status-${id}`).innerHTML = "FALLECIDO 💀";
    
    if (selectedPlayerId === id) {
        selectedPlayerId = null;
        document.getElementById('btn-inv').disabled = true;
        document.getElementById('btn-arr').disabled = true;
    }
}

function checkWinCondition() {
    const killer = players.find(p => p.role === 'killer');
    const livingCount = players.filter(p => p.isAlive).length;

    if (!killer.isAlive) {
        endGame(true, "El Asesino ha muerto.");
        return;
    }

    if (livingCount <= 2) {
        endGame(false, "Quedan muy pocos supervivientes. El Asesino gana.");
    }
}

function endGame(win, msg) {
    isGameOver = true;
    
    document.getElementById('btn-inv').disabled = true;
    document.getElementById('btn-arr').disabled = true;
    document.getElementById('btn-next').style.display = 'none';

    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const message = document.getElementById('modal-msg');

    modal.style.display = 'flex';
    message.innerText = msg;

    if (win) {
        title.innerText = "¡VICTORIA! 🏆";
        title.style.color = "#00f2ea";
    } else {
        title.innerText = "DERROTA 💀";
        title.style.color = "#ff0055";
    }
}

initGame();