document.addEventListener("DOMContentLoaded", () => {
    const messageInput = document.getElementById('message');
    const sendBtn = document.getElementById('send-btn');
    const messageList = document.getElementById('message-list');



    const userImage = 'assets/user.png';
    const username= 'Me';

    InfoBot.init();

    loadMessages();

    // Envoyer un message
    function sendMessage() {
        const message = messageInput.value.trim();
        if (message) {
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Format sans les secondes
            addMessage(username, message, 'user', time, userImage);
            InfoBot.processMessage(message);
            messageInput.value = ''; // Effacer le champ de saisie après l'envoi
        }
    }

    // Ajouter un message à l'interface et le sauvegarder
    function addMessage(author, text, senderType, time, image) {
        const messageItem = document.createElement('div');
        messageItem.className = `message ${senderType === 'user' ? 'sent' : 'received'}`;
        messageItem.innerHTML = `
            <div class="avatar">
                <img src="${image}" alt="${author}" />
            </div>
            <div class="message-content">
                <div class="text">${text}</div>
                <div class="time">${time}</div>
            </div>
        `;
        messageList.appendChild(messageItem);
        messageList.scrollTop = messageList.scrollHeight;

       
    }

    // On ajoute un bouton pour l'envoie du message
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Charger les messages du localStorage
    function loadMessages() {
        const messages = localStorage.getItem('messages');
        if (message.length > 0) {
            messages.forEach(message => {
                addMessage(message.author, message.text, message.senderType, message.time, message.image);
            });
        }
        
    }
});

// Classe pour le bot
class Bot {
    constructor(name, avatar, actions) {
        this.name = name;
        this.avatar = avatar;
        this.actions = actions;
    }

    respondToMessage(message) {
        for (let action of this.actions) {
            if (message.includes(action.trigger)) {
                let array = message.split(" ");
                action.execute(array);
                return true;
            }
        }
        return false;
    }

    respondToHelp() {
        for (let action of this.actions) {
            if (action.trigger === 'help') {
                action.execute([]);
            }
        }
    }
}

// Classe pour gérer les messages
class InfoBot {
    static bots = [];

    static init() {
        InfoBot.bots.push(new Bot("It's raining man", 'assets/bot-3.jpg', [
            { trigger: 'weather', execute: (array) => InfoBot.addBotMessage('Bot Weather', 1, 'assets/bot-3.jpg', array) },
            { trigger: 'help', execute: () => InfoBot.addBotMessage('Bot Weather', 0, 'assets/bot-3.jpg', []) }
        ]));
        InfoBot.bots.push(new Bot('Where to go ?', 'assets/bot-4.png', [
            { trigger: 'vol', execute: (array) => InfoBot.addBotMessage('Bot Flight', 2, 'assets/bot-4.png', array) },
            { trigger: 'help', execute: () => InfoBot.addBotMessage('Bot Flight', 0, 'assets/bot-4.png', []) }
        ]));
        InfoBot.bots.push(new Bot('Yoda said...', 'assets/bot-5.png', [
            { trigger: 'yoda', execute: (array) => InfoBot.addBotMessage('Bot Yoda', 3, 'assets/bot-5.png', array) },
            { trigger: 'help', execute: () => InfoBot.addBotMessage('Bot Yoda', 0, 'assets/bot-5.png', []) }
        ]));

        InfoBot.renderBots();
    }

    static renderBots() {
        const contactsList = document.getElementById('contacts').querySelector('ul');
        contactsList.innerHTML = '';
        InfoBot.bots.forEach(bot => {
            const li = document.createElement('md-list');
            li.className = 'bot-item';
            li.innerHTML = `
                <md-list-item class="bot">
                    <div class="bot-avatar">
                        <img src="${bot.avatar}">
                    </div>
                    <div class="bot-info">
                        <span class="bot-name">${bot.name}</span>
                    </div>
                <md-list-item>
            `;
            contactsList.appendChild(li);
        });
    }

    static async addBotMessage(botName, botChoix, image, array) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        let text = '';
        let url = '';
        switch(botChoix){
            case 0:
                if(botName == 'Bot Weather'){
                    text = "Besoin d'aider sur la météo ?";
                }
                if(botName == 'Bot Flight'){
                    text = "Vous chezchez un voyage pour vos vacances ?";
                }
                if(botName == 'Bot Yoda'){
                    text = "";
                }
                break;
            case 1:
                if(array.length > 1){
                    url = `https://api.open-meteo.com/v1/forecast?latitude=${array[1]}&longitude=${array[2]}&current=temperature_2m`;
                    const temperature = await this.getElementAPIWeather(url);
                    text = `A la latitude ${array[1]} et longitude ${array[2]} il fait une température de ${temperature}°C`;
                } else {
                    // Météo par défaut à Bordeaux
                    url = "https://api.open-meteo.com/v1/forecast?latitude=44.8333&longitude=-0.5667&current=temperature_2m";
                    const temperature = await this.getElementAPIWeather(url);
                    text = `Dans la ville de bordeaux il fait une température de ${temperature}°C`;
                }
                break;
            case 2:
                if(array.length > 1){
                    const [j, m, a] = array[1].split(/-|\//);
                    const date = new Date(a, m - 1, j);
                    url = `https://opensky-network.org/api/states/all?time=${date.getTime()}&icao24=${array[2]}`;
                    const flightData = await this.getElementAPIVol(url);
                    if(result.states == null){
                        text = `Le vol n'est pas touvable par cette API`;
                    } else {
                        text = `A la date ${array[1]} le vol ${array[2]} venant de ${flightData.origin} avait une vitesse de ${flightData.velocity}`;
                    }
                    
                } else {
                    // Vol par défaut 3c6444
                    url = "https://opensky-network.org/api/states/all?time=1720629352&icao24=3c6444";
                    const flightData = await this.getElementAPIVol(url);
                    const date = new Date(flightData.time);
                    text = `Le vol de transpondeur 3c6444 à la date ${date} provenant de ${flightData.states[0][2]} a une vitesse de ${flightData.states[0][9]}km/h à la longitude ${flightData.states[0][5]} et latitude ${flightData.states[0][6]}`;
                }
                break;
            case 3:
                if(array.length > 1){
                    array.shift();
                    const phraseProto = array.toString();
                    const phrase = phraseProto.replaceAll(",","&20");
                    console.log(phrase);
                    url = `https://api.funtranslations.com/translate/yoda.json?text=${phrase}`;
                    const reponse = await this.getElementAPIYoda(url);
                    text = `Version Yoda : ${reponse}`;
                } else {
                    // Phrase de base pour Yoda
                    url = "https://api.funtranslations.com/translate/yoda.json?text=Javascript%20is%20the%20best%20programmation%20language";
                    const reponse = await this.getElementAPIYoda(url);
                    text = `Version Yoda : ${reponse}`;
                }
                break;
            default: break;
        }
    
        const messageItem = document.createElement('div');
        messageItem.className = `message received`;
        messageItem.innerHTML = `
            <div class="avatar">
                <img src="${image}" alt="${botName}" />
            </div>
            <div class="message-content">
                <div class="text">${text}</div>
                <div class="time">${time}</div>
            </div>
        `;
        const messageList = document.getElementById('message-list');
        messageList.appendChild(messageItem);
        messageList.scrollTop = messageList.scrollHeight;
    }

    static processMessage(message) {
        if (message.includes('help')) {
            for (let bot of InfoBot.bots) {
                bot.respondToHelp();
            }
        } else {
            for (let bot of InfoBot.bots) {
                if (bot.respondToMessage(message)) {
                    break;
                }
            }
        }
    }

    static async getElementAPIWeather(url){
        let result; 
        await fetch(url).then(resp => resp.json())
        .then((data) => {
            result = data.current.temperature_2m;
        });
        return result;
    }

    static async getElementAPIVol(url){
        let result;
        await fetch(url).then(resp => resp.json())
        .then((data) => {
            result = data;
        });
        return result;
    }

    static async getElementAPIYoda(url){
        let result;
        await fetch(url).then(resp => resp.json())
        .then((data) => {
            result = data.contents.translated;
        });
        console.log(result);
        return result;
    }

}
