// import google spreadsheets
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
];
const jwt = new JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: SCOPES,
});
const doc = new GoogleSpreadsheet(process.env.GOOGLE_DOC_ID, jwt);


export async function updateTopDonatorsAllTimeLine(topDonators) {
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Feuille 1'];
    await sheet.loadCells('A1:A12');
    for (let i = 0; i < Math.min(10, topDonators.length); i++) {
        const cell = sheet.getCell(i + 1, 0);
        // Fill cell with donator username and amount from json file
        cell.value = topDonators[i].userName + ' ' + topDonators[i].amount + '€';
    }
    await sheet.saveUpdatedCells();
}

export async function updateTopDonatorsAllTimeBatch(topDonators) {
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Feuille 1'];
    await sheet.loadCells('B2:B2');
    let cellValue = '';
    for (let i = 0; i < Math.min(10, topDonators.length); i++) {
        cellValue += topDonators[i].userName + ' ' + topDonators[i].amount + '€';
        // Add line break if not last donator
        if (i < Math.min(10, topDonators.length) - 1) {
            cellValue += '\n';
        }
    }
    const cell = sheet.getCell(1, 1);
    cell.value = cellValue;
    await sheet.saveUpdatedCells();
}

export async function updateHoursDonatorsLine(topDonators) {
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Feuille 1'];
    await sheet.loadCells('C1:C12');
    // Modify header cell to display current hour
    const headerCell = sheet.getCell(0, 2);
    headerCell.value = new Date().getHours() + 'h - ' + (new Date().getHours() + 1) + 'h';
    for (let i = 0; i < 10; i++) {
        const cell = sheet.getCell(i + 1, 2);
        if (i < topDonators.length) {
            // Fill cell with donator username and amount from json file
            cell.value = topDonators[i].userName + ' ' + topDonators[i].amount + '€';
        } else {
            // Clear cell
            cell.value = '';
        }
    }
    await sheet.saveUpdatedCells();
}

export async function updateHoursDonatorsBatch(topDonators) {
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Feuille 1'];
    await sheet.loadCells('D2:D2');
    // Modify header cell to display current hour
    const headerCell = sheet.getCell(1, 3);
    headerCell.value = new Date().getHours() + 'h - ' + (new Date().getHours() + 1) + 'h';
    let cellValue = '';
    for (let i = 0; i < Math.min(10, topDonators.length); i++) {
        cellValue += topDonators[i].userName + ' ' + topDonators[i].amount + '€';
        // Add line break if not last donator
        if (i < Math.min(10, topDonators.length) - 1) {
            cellValue += '\n';
        }
    }
    const cell = sheet.getCell(1, 3);
    cell.value = cellValue;
    await sheet.saveUpdatedCells();
}

export async function updateLastDonator(lastDonator) {
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Feuille 1'];
    await sheet.loadCells('E2:E2');
    const cell = sheet.getCell(1, 4);
    cell.value = lastDonator.username + '\n' + lastDonator.amount + '€';
    await sheet.saveUpdatedCells();
}