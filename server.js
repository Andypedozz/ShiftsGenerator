const express = require("express");
const fs = require('fs');
const path = require("path");
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/")));
app.use(express.json());

// Carica la configurazione
function loadConfig() {
    const data = fs.readFileSync(path.join(__dirname,'rider-config.json'));
    return JSON.parse(data);
}

const daysOfWeek = ["Lunedi", "Martedi", "Mercoledi", "Giovedi", "Venerdi", "Sabato", "Domenica"];

// Converte giorno nel mese in numero assoluto (es. 1-28)
function getDayNumber(week, day) {
    const dayIndex = daysOfWeek.indexOf(day);
    return (week - 1) * 7 + dayIndex + 1;
}

// Genera il calendario di 4 settimane
function generateMonthlySchedule(config) {
    const { riders, weeklyNeeds } = config;
    const schedule = [];
    const shiftsCount = {};

    riders.forEach(rider => {
        shiftsCount[rider.name] = 0;
    });

    for (let week = 1; week <= 4; week++) {
        daysOfWeek.forEach(day => {
            const daySchedule = { week, day, riders: [] };
            const dayNumber = getDayNumber(week, day);

            if (day !== "Martedi") {
                daySchedule.riders.push("Miky");
                shiftsCount["Miky"]++;
            }

            const requiredRiders = weeklyNeeds[day];
            const availableRiders = riders.filter(rider => {
                if (rider.name === "Miky" && day !== "Martedi") return false;
                if (rider.fixedDayOff === day) return false;  // Miky ha un giorno fisso
                if (rider.requestedDaysOff?.includes(dayNumber)) return false;  // Giorno libero specifico
                if (workedPreviousDay(schedule, week, day, rider.name)) return false;
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
    }

    return schedule;
}

// Controlla se il rider ha lavorato il giorno prima
function workedPreviousDay(schedule, week, day, riderName) {
    if (week === 1 && day === "Lunedi") return false;

    const dayIndex = daysOfWeek.indexOf(day);
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

// Stampa il calendario in console
function printSchedule(schedule) {
    console.log("Calendario Turni Mensile\n");
    schedule.forEach(day => {
        console.log(`Settimana ${day.week} - ${day.day}: ${day.riders.join(', ')}`);
    });
}

function printCountShifts(schedule, config) {
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

// Funzione principale
let config;
let schedule;
let count;

calc();

function calc() {
    config = loadConfig();
    schedule = generateMonthlySchedule(config);
    count = printCountShifts(schedule,config)
}

app.get("/schedule", (req, res) => {
    res.json(schedule);
});

app.get("/totals", (req, res) => {
    res.json(count);
});

app.get("/gui", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
})

app.post("/recalc", (req, res) => {
    calc();
    res.status(200).send({ message: "Schedule regenerated"});
});

app.listen(port, () => {
    console.log("Server attivo sulla porta: "+port);
})

