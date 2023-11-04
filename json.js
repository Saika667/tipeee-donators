import fs from 'fs';
import path from 'path';
import { 
    updateTopDonatorsAllTimeLine,
    updateTopDonatorsAllTimeBatch,
    updateHoursDonatorsLine,
    updateHoursDonatorsBatch,
    updateLastDonator
} from './sheet.js';
import { fileURLToPath } from 'url';
import { updateTopDonators, formatDateForRanking } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function saveDonationToJSONFile(donationData) {
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
            const currencySymbol = donationData.event.formattedAmount.charAt(0);
            donation = {
                ref: donationData.event.ref,
                username: donationData.event.user.username,
                userId: donationData.event.user.id,
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
            updateTopDonatorsAllTimeLine(topDonators.global);
            updateTopDonatorsAllTimeBatch(topDonators.global);
            updateHoursDonatorsLine(topDonators.hourly[dateForRanking]);
            updateHoursDonatorsBatch(topDonators.hourly[dateForRanking]);
            updateLastDonator(donatorData);
            if (error) {
                console.log(error);
            }
        });
    });
}