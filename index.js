import 'dotenv/config';
import axios from 'axios';
import { io } from 'socket.io-client';
import { saveDonationToJSONFile } from './json.js';

// Get clients from .env file
const clientCredentials = process.env;
const apiKey = clientCredentials.API_KEY;
const apiURL = clientCredentials.API_URL;

// Get socket connection information from Tipeee API
getSocketConnectionInformation()
    .then((data) => {
        const port = data.datas.port;
        const host = data.datas.host;
        // Connect to socket with Tipeee format
        const socket = io(`${host}:${port}`, {
            query: {
                access_token: apiKey
            }
        });
        socket.on('connect', () => {
            console.log('Connected to socket');
            // When connected to socket, join the room
            socket.emit('join-room', {
                room: apiKey,
                username: 'Smallsy'
            });

            // Listen to new events
            socket.on('new-event', (data) => {
                console.log(data);
                // Check if event is a donation
                if (data.event.type === 'donation') {
                    saveDonationToJSONFile(data);
                }
            });
        });
    })
    .catch((error) => {
        console.log(error);
    });

export function updateTopDonators(donators, donatorData) {
    // Check if donator already exists
    const donatorExist = donators.filter((donatorIteration) => {
        return donatorIteration.userId === donatorData.userId;
    });
    let donator = {};
    if (donatorExist.length === 0) {
        donator = {
            userName: donatorData.username,
            userId: donatorData.userId,
            amount: donatorData.amount,
            donationsRef: [donatorData.ref]
        }
        donators.push(donator);
    } else {
        donator = donatorExist[0];
        donator.amount += donatorData.amount;
        donator.donationsRef.push(donatorData.ref);
    }
    // Sort global top donators
    donators.sort((a, b) => {
        return b.amount - a.amount;
    });
}

export function formatDateForRanking(date) {
    return [
        date.getDate(),
        date.getMonth()+1,
        date.getFullYear()
    ].join('/')+' '+
    [
        date.getHours(),
        '00',
        '00'
    ].join(':');
}

// Get socket connection information from Tipeee API
async function getSocketConnectionInformation() {
    const socketConnectionInformation = await axios.get(`https://api.tipeeestream.com/v2.0/site/socket`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => {
            console.log(error.response.data);
        });
    return socketConnectionInformation;
}