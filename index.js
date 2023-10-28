require('dotenv').config();
const axios = require('axios');
const { io } = require('socket.io-client');
const fs = require('fs');
const path = require('path');

// Get clients from .env file
const clientCredentials = process.env;
const apiKey = clientCredentials.API_KEY;
const apiURL = clientCredentials.API_URL;

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
                // console.log(data);
                // Check if event is a donation
                if (data.event.type === 'donation') {
                    const donationParams = data.event.parameters;
                    // Construct donation object
                    const donation = {
                        ref: data.event.ref,
                        username: donationParams.username,
                        amount: donationParams.amount,
                        formattedAmount: data.event.formattedAmount,
                        currency: donationParams.currency,
                        message: donationParams.message,
                        date: data.event.created_at
                    };
                    saveDonationToJSONFile(donation);
                }
            });
        });
    })
    .catch((error) => {
        console.log(error);
    });


function saveDonationToJSONFile(donation) {
    fs.readFile(path.join(__dirname, 'json/donations.json'), 'utf8', (error, data) => {
        let donations = JSON.parse(data);
        // Check if donation already exists
        const donationExist = donations.filter((donationIteration) => {
            return donationIteration.ref === donation.ref;
        });
        if (donationExist.length === 0) {
            // TODO : Check with Harris order of donations
            donations.push(donation);
            fs.writeFile(path.join(__dirname, 'json/donations.json'), JSON.stringify(donations), (error) => {
                if (error) {
                    console.log(error);
                }
            });
        }
    });
}

function updateTopDonators() {
    // TODO : Update top donators
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