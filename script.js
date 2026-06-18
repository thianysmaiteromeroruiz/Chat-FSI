// ========== ELEMENTOS DOM ==========
const menuButton = document.getElementById('menuButton');
const menuPanel = document.getElementById('menuPanel');
const bluetoothStatusSpan = document.getElementById('bluetoothStatus');
const wifiStatusSpan = document.getElementById('wifiStatus');
const liveTimeSpan = document.getElementById('liveTime');
const devicesListUl = document.getElementById('devicesList');

const btnBluetooth = document.getElementById('btnBluetooth');
const btnWifiDirect = document.getElementById('btnWifiDirect');
const btnConnect = document.getElementById('btnConnect');
const btnDisconnect = document.getElementById('btnDisconnect');

const contactsList = document.getElementById('contactsList');
const contactsCount = document.getElementById('contactsCount');
const chatMessagesDiv = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const currentContactName = document.getElementById('currentContactName');
const sosButton = document.getElementById('sosButton');

// ========== ESTADO ==========
let bluetoothOn = false;
let wifiOn = false;
let meshConnected = false;
let currentUserName = "Yo";
let devices = []; // {id, nombre}
let activeContact = null; // nombre del contacto seleccionado
let chatHistories = {}; // { nombreContacto: [mensajes] }

// ========== FUNCIONES ==========
function updateTime() {
    const now = new Date();
    liveTimeSpan.textContent = now.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateTime, 1000);
updateTime();

function addMessage(text, type = 'system', from = '') {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    const time = new Date().toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });
    if (type === 'user') {
        msgDiv.classList.add('user-message');
        msgDiv.innerHTML = `<strong>Tú:</strong> ${text}<br><span style="font-size:0.6rem">${time}</span>`;
    } else if (type === 'other') {
        msgDiv.classList.add('other-message');
        msgDiv.innerHTML = `<strong>${from}:</strong> ${text}<br><span style="font-size:0.6rem">${time}</span>`;
    } else {
        msgDiv.classList.add('system-message');
        msgDiv.innerHTML = `<i class="fas fa-microchip"></i> ${text}`;
    }
    chatMessagesDiv.appendChild(msgDiv);
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
}

function renderMessagesForContact(contactName) {
    chatMessagesDiv.innerHTML = '';
    if (!contactName) {
        chatMessagesDiv.innerHTML = `
            <div class="message system-message">
                <i class="fas fa-plug"></i> Selecciona un contacto para chatear.
            </div>
        `;
        return;
    }
    const messages = chatHistories[contactName] || [];
    if (messages.length === 0) {
        chatMessagesDiv.innerHTML = `
            <div class="message system-message">
                <i class="fas fa-comment"></i> No hay mensajes con ${contactName}. ¡Envía uno!
            </div>
        `;
        return;
    }
    messages.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message');
        const time = msg.time || new Date().toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });
        if (msg.type === 'user') {
            msgDiv.classList.add('user-message');
            msgDiv.innerHTML = `<strong>Tú:</strong> ${msg.text}<br><span style="font-size:0.6rem">${time}</span>`;
        } else if (msg.type === 'other') {
            msgDiv.classList.add('other-message');
            msgDiv.innerHTML = `<strong>${msg.from}:</strong> ${msg.text}<br><span style="font-size:0.6rem">${time}</span>`;
        } else {
            msgDiv.classList.add('system-message');
            msgDiv.innerHTML = `<i class="fas fa-microchip"></i> ${msg.text}`;
        }
        chatMessagesDiv.appendChild(msgDiv);
    });
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
}

function updateContactsList() {
    contactsList.innerHTML = '';
    const otherDevices = devices.filter(d => d.nombre !== currentUserName);
    contactsCount.textContent = otherDevices.length;

    if (otherDevices.length === 0) {
        contactsList.innerHTML = '<li class="no-contacts"><i class="fas fa-plug"></i> Sin contactos</li>';
        return;
    }

    otherDevices.forEach(dev => {
        const li = document.createElement('li');
        li.innerHTML = `<i class="fas fa-user"></i> ${dev.nombre}`;
        li.dataset.contact = dev.nombre;
        if (activeContact === dev.nombre) {
            li.classList.add('active');
        }
        li.addEventListener('click', () => {
            selectContact(dev.nombre);
        });
        contactsList.appendChild(li);
    });
}

function selectContact(contactName) {
    activeContact = contactName;
    currentContactName.textContent = contactName;
    // Actualizar clases activas en la lista
    document.querySelectorAll('#contactsList li').forEach(li => {
        li.classList.toggle('active', li.dataset.contact === contactName);
    });
    // Habilitar chat
    messageInput.disabled = false;
    sendMessageBtn.disabled = false;
    // Renderizar mensajes
    renderMessagesForContact(contactName);
}

function updateDevicesListUI() {
    devicesListUl.innerHTML = '';
    if (!meshConnected || devices.length === 0) {
        devicesListUl.innerHTML = '<li><i class="fas fa-plug"></i> Sin conexión</li>';
        return;
    }
    const otherDevices = devices.filter(d => d.nombre !== currentUserName);
    if (otherDevices.length === 0) {
        devicesListUl.innerHTML = '<li><i class="fas fa-user"></i> Solo tú conectado</li>';
    } else {
        otherDevices.forEach(dev => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-mobile-alt"></i> ${dev.nombre}`;
            devicesListUl.appendChild(li);
        });
    }
}

function generateMockDevices() {
    const names = ["Ana", "Carlos", "Rosa", "Joseph", "Marta", "Luis", "Sofía", "Miguel", "Elena", "Pablo"];
    const num = Math.floor(Math.random() * 3) + 2; // entre 2 y 4 dispositivos
    const shuffled = [...names].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, num);
    return selected.map((name, idx) => ({ id: idx+1, nombre: name }));
}

function connectMesh() {
    if (!bluetoothOn || !wifiOn) {
        addMessage("❌ Activa primero Bluetooth y Wi-Fi Direct desde el menú.", 'system');
        return;
    }
    meshConnected = true;
    devices = generateMockDevices();
    updateDevicesListUI();
    updateContactsList();

    messageInput.disabled = true;
    sendMessageBtn.disabled = true;
    btnConnect.disabled = true;
    btnDisconnect.disabled = false;

    addMessage(`✅ Conectado a la red. ${devices.filter(d => d.nombre !== currentUserName).length} contacto(s) disponible(s).`, 'system');
    // Seleccionar el primer contacto automáticamente si hay
    const otherDevices = devices.filter(d => d.nombre !== currentUserName);
    if (otherDevices.length > 0) {
        selectContact(otherDevices[0].nombre);
    } else {
        currentContactName.textContent = "Sin contactos";
        chatMessagesDiv.innerHTML = `
            <div class="message system-message">
                <i class="fas fa-info-circle"></i> No hay otros dispositivos conectados.
            </div>
        `;
    }
}

function disconnectMesh() {
    meshConnected = false;
    devices = [];
    activeContact = null;
    chatHistories = {};
    updateDevicesListUI();
    updateContactsList();
    messageInput.disabled = true;
    sendMessageBtn.disabled = true;
    btnConnect.disabled = false;
    btnDisconnect.disabled = true;
    currentContactName.textContent = "Selecciona un contacto";
    chatMessagesDiv.innerHTML = `
        <div class="message system-message">
            <i class="fas fa-plug"></i> Conéctate a la red y selecciona un contacto para chatear.
        </div>
    `;
    addMessage("🔌 Desconectado de la red.", 'system');
}

function sendMessage() {
    if (!meshConnected) {
        addMessage("No estás conectado a la red.", 'system');
        return;
    }
    if (!activeContact) {
        addMessage("Selecciona un contacto primero.", 'system');
        return;
    }
    const message = messageInput.value.trim();
    if (message === "") return;

    // Guardar mensaje en el historial del contacto
    if (!chatHistories[activeContact]) {
        chatHistories[activeContact] = [];
    }
    chatHistories[activeContact].push({
        type: 'user',
        text: message,
        time: new Date().toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' })
    });

    // Mostrar en el chat
    addMessage(message, 'user');
    messageInput.value = '';

    // Simular respuesta del otro usuario (SIN CHATBOT, solo si hay otros usuarios reales, pero aquí es simulación)
    // Para simular una respuesta de otro usuario, podemos hacer que el otro usuario "responda" después de un tiempo
    // PERO como el usuario pidió ELIMINAR LOS CHATBOTS, no pondré respuestas automáticas.
    // En su lugar, dejaré que solo se muestren los mensajes enviados por el usuario.
    // Para demostrar que la red funciona, podríamos simular que el otro usuario envía un mensaje ocasional, pero lo dejaré limpio.
}

// Enviar SOS al contacto seleccionado
function sendSOS() {
    if (!meshConnected) {
        addMessage("Conéctate a la red para enviar SOS.", 'system');
        return;
    }
    if (!activeContact) {
        addMessage("Selecciona un contacto para enviar la alerta SOS.", 'system');
        return;
    }
    const sosMsg = "🚨 ¡ALERTA DE EMERGENCIA! 🚨 Activado botón SOS. Por favor, ayude a los vecinos.";
    
    // Guardar en historial
    if (!chatHistories[activeContact]) {
        chatHistories[activeContact] = [];
    }
    chatHistories[activeContact].push({
        type: 'user',
        text: sosMsg,
        time: new Date().toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' })
    });
    addMessage(sosMsg, 'user');
    
    // Simular reenvío por la red (sin chatbot)
    setTimeout(() => {
        if (meshConnected) {
            addMessage("🔄 Alerta SOS enviada a la red.", 'system');
        }
    }, 500);
}

// ========== EVENTOS ==========
menuButton.addEventListener('click', () => {
    menuPanel.style.display = menuPanel.style.display === 'none' ? 'flex' : 'none';
});

btnBluetooth.addEventListener('click', () => {
    bluetoothOn = !bluetoothOn;
    if (bluetoothOn) {
        btnBluetooth.classList.add('active');
        bluetoothStatusSpan.textContent = 'Activo';
        addMessage("Bluetooth activado. Ahora activa Wi-Fi Direct.", 'system');
    } else {
        btnBluetooth.classList.remove('active');
        bluetoothStatusSpan.textContent = 'Apagado';
        if (meshConnected) disconnectMesh();
        addMessage("Bluetooth apagado. Red desconectada.", 'system');
    }
    if (bluetoothOn && wifiOn && !meshConnected) btnConnect.disabled = false;
    else if (!bluetoothOn || !wifiOn) btnConnect.disabled = true;
});

btnWifiDirect.addEventListener('click', () => {
    wifiOn = !wifiOn;
    if (wifiOn) {
        btnWifiDirect.classList.add('active');
        wifiStatusSpan.textContent = 'Activo';
        addMessage("Wi-Fi Direct activado. Red disponible.", 'system');
    } else {
        btnWifiDirect.classList.remove('active');
        wifiStatusSpan.textContent = 'Apagado';
        if (meshConnected) disconnectMesh();
        addMessage("Wi-Fi Direct apagado. Red desconectada.", 'system');
    }
    if (bluetoothOn && wifiOn && !meshConnected) btnConnect.disabled = false;
    else btnConnect.disabled = true;
});

btnConnect.addEventListener('click', connectMesh);
btnDisconnect.addEventListener('click', disconnectMesh);

sendMessageBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

sosButton.addEventListener('click', sendSOS);

// Inicialización
disconnectMesh();