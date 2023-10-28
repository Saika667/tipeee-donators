require('dotenv').config();
const axios = require('axios');
const { io } = require('socket.io-client');
const fs = require('fs');
const path = require('path');

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


function saveDonationToJSONFile(donationData) {
    fs.readFile(path.join(__dirname, 'json/donations.json'), 'utf8', (error, data) => {
        let donations = JSON.parse(data);
        // Check if donation already exists
        const donationExist = donations.filter((donationIteration) => {
            return donationIteration.ref === donationData.event.ref;
        });
        let donation = {};
        if (donationExist.length === 0) {
            // Construct donation object
            const donationParams = donationData.event.parameters;
            const userProviders = donationData.event.user.providers;
            const twitchProvider = userProviders.filter((provider) => {
                return provider.code === 'twitch';
            });
            const currencySymbol = donationData.event.formattedAmount.charAt(0);
            donation = {
                ref: donationData.event.ref,
                username: donationParams.username,
                twitchUsername: twitchProvider[0].username,
                amount: donationParams.amount,
                formattedAmount: donationParams.amount + currencySymbol,
                currency: donationParams.currency,
                message: donationParams.message,
                date: donationData.event.created_at
            };
            // TODO : Check with Harris order of donations
            donations.push(donation);
            fs.writeFile(path.join(__dirname, 'json/donations.json'), JSON.stringify(donations, null, "\t"), (error) => {
                if (error) {
                    console.log(error);
                }
            });

            // Update top donators
            updateTopDonatorsJSONFile(donation);
        } else {
            // Get donation data from JSON file
            donation = donations.filter((donationIteration) => {
                return donationIteration.ref === donationData.event.ref;
            });
        }

        // Write donation to alert feed
        fs.readFile(path.join(__dirname, 'json/alerts-feed.json'), 'utf8', (error, data) => {
            const alertFeed = JSON.parse(data);
            alertFeed.push(donation);
            fs.writeFile(path.join(__dirname, 'json/alerts-feed.json'), JSON.stringify(alertFeed, null, "\t"), (error) => {
                if (error) {
                    console.log(error);
                }
            });
        });
    });
}

function updateTopDonatorsJSONFile(donatorData) {
    // Update global top donators
    fs.readFile(path.join(__dirname, 'json/top-donators.json'), 'utf8', (error, data) => {
        let topDonators = JSON.parse(data);

        // Update top donators of all time
        updateTopDonators(topDonators.global, donatorData);

        // Update top donators of the hour
        const date = new Date();
        const dateForRanking = formatDateForRanking(date);
        // Check if hour property exists
        if (!topDonators.hourly.hasOwnProperty(dateForRanking)) {
            topDonators.hourly[dateForRanking] = [];
        }
        updateTopDonators(topDonators.hourly[dateForRanking], donatorData);

        fs.writeFile(path.join(__dirname, 'json/top-donators.json'), JSON.stringify(topDonators, null, "\t"), (error) => {
            if (error) {
                console.log(error);
            }
        });
    });
}

function updateTopDonators(donators, donatorData) {
    // Check if donator already exists
    const donatorExist = donators.filter((donatorIteration) => {
        return donatorIteration.twitchUsername === donatorData.twitchUsername;
    });
    let donator = {};
    if (donatorExist.length === 0) {
        donator = {
            twitchUsername: donatorData.twitchUsername,
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

function formatDateForRanking(date) {
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