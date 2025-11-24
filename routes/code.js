const express = require('express');
const router = express.Router();
const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { findCommand } = require('../lib/command');
const config = require('../config');
const fs = require('fs');
const path = require('path');

const activeSockets = new Map();
const SESSION_BASE_PATH = './session';

// Ensure session directory exists
if (!fs.existsSync(SESSION_BASE_PATH)) {
    fs.mkdirSync(SESSION_BASE_PATH, { recursive: true });
}

router.get('/', async (req, res) => {
    const { number } = req.query;
    
    if (!number) {
        return res.status(400).json({ error: 'Number parameter is required' });
    }

    try {
        const { state, saveCreds } = await useMultiFileAuthState(path.join(SESSION_BASE_PATH, number));
        const socket = makeWASocket({
            auth: state,
            printQRInTerminal: true,
            logger: { level: 'silent' } // Disable verbose logging
        });

        socket.ev.on('connection.update', (update) => {
            if (update.connection === 'open') {
                activeSockets.set(number, socket);
                setupHandlers(socket);
                res.status(200).json({ status: 'connected', number });
            }
        });

        socket.ev.on('creds.update', saveCreds);
        
        // 1 minute timeout for QR code
        setTimeout(() => {
            if (!activeSockets.has(number)) {
                res.status(408).json({ error: 'Connection timeout' });
            }
        }, 60000);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

function setupHandlers(socket) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const text = msg.message.conversation || 
                    msg.message.extendedTextMessage?.text || '';
        
        if (!text.startsWith(config.PREFIX)) return;
        
        const cmdName = text.slice(config.PREFIX.length).split(' ')[0].toLowerCase();
        const command = findCommand(cmdName);
        
        if (command) {
            try {
                await command.function(socket, msg, {
                    from: msg.key.remoteJid,
                    pushname: msg.pushName,
                    quoted: msg,
                    reply: (text) => socket.sendMessage(msg.key.remoteJid, { text }, { quoted: msg })
                });
            } catch (error) {
                console.error('Command error:', error);
            }
        }
    });
}

module.exports = router;
