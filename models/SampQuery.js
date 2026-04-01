const dgram = require('dgram');

class SampQuery {
    constructor(serverIP, serverPort) {
        this.serverIP = this.verifyAddress(serverIP);
        this.serverPort = serverPort;
        this.socket = dgram.createSocket('udp4');

        this.socket.on('error', (err) => {
            console.error('Socket error:', err);
            this.close(); // Cierra el socket si hay un error
        });

        this.socket.on('listening', () => {
            console.log(`Socket listening on ${this.serverIP}:${this.serverPort}`);
        });

        if (!this.serverIP || isNaN(this.serverPort)) {
            throw new Error('Invalid server IP or port');
        }
    }

    verifyAddress(serverIP) {
        // Aquí podrías agregar lógica para validar la dirección IP
        return serverIP; // Devuelve la dirección IP directamente
    }

    sendPacket(packet) {
        return new Promise((resolve, reject) => {
            const message = Buffer.from(`SAMP${this.serverIP.split('.').map((octet) => String.fromCharCode(octet)).join('')}${String.fromCharCode(this.serverPort & 0xFF)}${String.fromCharCode(this.serverPort >> 8 & 0xFF)}${packet}`);
            console.log(`Enviando paquete: ${message.toString('hex')}`); // Mensaje de depuración
            this.socket.send(message, this.serverPort, this.serverIP, (err) => {
                if (err) {
                    console.error('Error sending packet:', err);
                    return reject(err);
                }
                console.log(`Paquete enviado a ${this.serverIP}:${this.serverPort}`);
                resolve();
            });
        });
    }

    receivePacket() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout waiting for response.'));
                this.close(); // Cierra el socket después del timeout
            }, 10000); // Aumentado a 10 segundos

            this.socket.on('message', (msg) => {
                clearTimeout(timeout);
                console.log(`Mensaje recibido: ${msg.toString('hex')}`); // Mensaje de depuración
                resolve(msg);
            });
        });
    }

    async getInfo() {
        console.log('Solicitando información del servidor...'); // Mensaje de depuración
        await this.sendPacket('i');
        const response = await this.receivePacket();

        if (response.toString('utf-8', 0, 4) !== 'SAMP') {
            throw new Error('Invalid response from server');
        }

        const password = response[11]; // Ejemplo: obtener la contraseña
        const players = response.readUInt16BE(12); // Número de jugadores
        const maxPlayers = response.readUInt16BE(14); // Jugadores máximos
        const hostname = response.toString('utf-8', 16, 36).trim(); // Nombre del servidor
        const gamemode = response.toString('utf-8', 36, 56).trim(); // Modo de juego
        const map = response.toString('utf-8', 56, 76).trim(); // Mapa

        return {
            password,
            players,
            maxPlayers,
            hostname,
            gamemode,
            map,
        };
    }

    close() {
        if (this.socket) {
            console.log('Cerrando socket...'); // Mensaje de depuración
            this.socket.close(); // Cierra el socket si existe
            this.socket = null; // Evita que se intente cerrar de nuevo
        }
        
    }
    
}

module.exports = SampQuery;
