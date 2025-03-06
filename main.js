const express = require("express");
const fs = require('fs');
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/")));
app.use(express.json());

const daysOfWeek = ["Lunedi", "Martedi", "Mercoledi", "Giovedi", "Venerdi", "Sabato", "Domenica"];

let config;
let schedule;
let count;
let daysOfMonth;

function loadConfig() {
    const data = fs.readFileSync(path.join(__dirname,'rider-config2.json'));
    return JSON.parse(data);
}

function suddividiArray(array, dimensione) {
    const risultato = [];
    for (let i = 0; i < array.length; i += dimensione) {
        risultato.push(array.slice(i, i + dimensione));
    }
    return risultato;
}

function generateNumbers() {
    let month = [];
    const daysRange = config["daysRange"];
    const startDay = daysRange[0];
    const endDay = daysRange[1];
    for(let i = startDay, j = 0; i <= endDay; i++, j = (j + 1) % 7) {
        month.push({ "number": i, "name" : daysOfWeek[j]});
    }
    
    month = suddividiArray(month, 7);
    daysOfMonth = month;
}

function calc() {
    config = loadConfig();
    generateNumbers();
    schedule = generateMonthlySchedule();
    count = getShiftsCounts();
    console.log(schedule);
}

function generateMonthlySchedule() {
    const { riders, weeklyNeeds } = config;
    const schedule = [];
    const shiftsCount = {};

    riders.forEach(rider => {
        shiftsCount[rider["name"]] = 0;
    });

    let weekIndex = 1;
    daysOfMonth.forEach(week => {
        week.forEach(day => {
            const dayName = day["name"];
            const daySchedule = { weekIndex, dayName, riders: []};
            const dayNumber = day["number"];

            // Assegnamo Miky tutti i giorni tranne il martedì in quanto giorno libero
            if (dayName !== "Martedi") {
                daySchedule.riders.push("Miky");
                shiftsCount["Miky"]++;
            }

            const requiredRiders = weeklyNeeds[dayName];
            const availableRiders = riders.filter(rider => {
                if(rider.requestedDaysOff.includes(dayNumber)) return false;
                if(workedPreviousDay(schedule, weekIndex, dayName, rider.name)) return false;
                return true;
            });

            availableRiders.sort((a, b) => shiftsCount[a.name] - shiftsCount[b.name]);

            while (daySchedule.riders.length < requiredRiders && availableRiders.length > 0) {
                const rider = availableRiders.shift();
                daySchedule.riders.push(rider.name);
                shiftsCount[rider.name]++;
            }

            schedule.push(daySchedule);
        });
        weekIndex++;
    });

    return schedule;
}

function workedPreviousDay(schedule, week, dayName, riderName) {
    if (week === 1 && dayName === "Lunedi") return false;

    const dayIndex = daysOfWeek.indexOf(dayName);
    let previousDay, previousWeek;

    if (dayIndex === 0) {
        previousDay = "Domenica";
        previousWeek = week - 1;
    } else {
        previousDay = daysOfWeek[dayIndex - 1];
        previousWeek = week;
    }

    const previousShift = schedule.find(s => s.week === previousWeek && s.day === previousDay);
    return previousShift ? previousShift.riders.includes(riderName) : false;
}

function getShiftsCounts() {
    const count = {};

    const riders = config["riders"];
    riders.forEach(rider => {
        let totTurni = 0;
        schedule.forEach(day => {
            if(day["riders"].includes(rider["name"])) {
                totTurni++;
            }
        });
        count[rider["name"]] = totTurni;
    });

    return count;
}

function printSchedule(schedule) {
    console.log("Calendario Turni Mensile\n");
    schedule.forEach(day => {
        console.log(`Settimana ${day.week} - ${day.day}: ${day.riders.join(', ')}`);
    });
}

calc();

