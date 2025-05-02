const express = require("express");
const fs = require('fs');
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/")));
app.use(express.json());

const daysOfWeek = ["Lunedi", "Martedi", "Mercoledi", "Giovedi", "Venerdi", "Sabato", "Domenica"];

/*******************************************/
/*                FUNCTIONS                */
/*******************************************/

function suddividiArray(array, dimensione) {
    const risultato = [];
    for (let i = 0; i < array.length; i += dimensione) {
        risultato.push(array.slice(i, i + dimensione));
    }
    return risultato;
}

function generateDays(config) {
    let month = [];
    const daysRange = config["daysRange"];
    const startDay = parseInt(daysRange[0]);
    const endDay = parseInt(daysRange[1]);
    for(let i = startDay, j = 0; i <= endDay; i++, j = (j + 1) % 7) {
        month.push({ "number": i.toString(), "name" : daysOfWeek[j]});
    }
    
    month = suddividiArray(month, 7);
    const daysOfMonth = month;
    return daysOfMonth;
}

function generateMonthlySchedule(config) {
    const daysOfMonth = generateDays(config);
    const { riders, weeklyNeeds } = config;
    const schedule = [];
    const shiftsCount = {};

    riders.forEach(rider => {
        shiftsCount[rider.name] = 0;
    });

    let weekIndex = 1;
    daysOfMonth.forEach(week => {
        week.forEach(day => {
            const dayName = day["name"];
            const dayNumber = day["number"];
            const daySchedule = { weekIndex, dayName, dayName, dayNumber, riders: [], "ridersCount" : 0};

            // Assegnamo Miky tutti i giorni tranne il martedì in quanto giorno libero
            if(dayName != "Martedi" && !riders[0].requestedDaysOff.includes(dayNumber.toString())) {
                daySchedule.ridersCount = daySchedule.ridersCount + 1;
                shiftsCount["Miky"]++;
            }
            
            const requiredRiders = weeklyNeeds[dayName];
            const availableRiders = riders.filter(rider => {
                if(rider.name == "Miky" && day != "Martedi") return false;
                if(rider.requestedDaysOff.includes(dayNumber.toString())) return false;
                if(workedPreviousDay(schedule, weekIndex, dayName, rider.name)) return false;
                return true;
            });
            
            availableRiders.sort((a, b) => shiftsCount[a.name] - shiftsCount[b.name]);
            
            while (daySchedule.ridersCount < requiredRiders && availableRiders.length > 0) {
                const rider = availableRiders.shift();
                daySchedule.riders.push(rider.name);
                daySchedule.ridersCount = daySchedule.ridersCount + 1;
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

function getShiftsCounts(config, schedule) {
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

function exportCsv(data) {
    const schedule = data.schedule;
    let csvContent = "";

    // Raggruppare i dati per settimane
    let weeks = {};
    schedule.forEach(entry => {
        if (!weeks[entry.weekIndex]) {
            weeks[entry.weekIndex] = [];
        }
        weeks[entry.weekIndex].push(entry);
    });

    // Costruire il CSV
    Object.keys(weeks).forEach(weekIndex => {
        let week = weeks[weekIndex];

        // Creare intestazione settimanale
        let headerRow = week.map(entry => `${entry.dayName} ${entry.dayNumber}`).join(";");
        csvContent += headerRow + "\n";

        // Determinare il numero massimo di riders per qualsiasi giorno in questa settimana
        let maxRiders = Math.max(...week.map(entry => entry.riders.length));

        // Aggiungere i nomi dei riders riga per riga
        for (let i = 0; i < maxRiders; i++) {
            let row = week.map(entry => (entry.riders[i] ? entry.riders[i] : "")).join(";");
            csvContent += row + "\n";
        }

        csvContent += "\n"; // Riga vuota tra le settimane
    });

    fs.writeFileSync(path.join(__dirname, "csvExport.csv"), csvContent);
}

function calc(config) {
    const schedule = generateMonthlySchedule(config);
    const shiftsCount = getShiftsCounts(config, schedule);
    const data = {
        "schedule" : schedule,
        "count" : shiftsCount
    };
    return data;
}

/*************************************************/
/*                 ENDPOINTS                     */
/*************************************************/

app.get("/", (req, res) => {
    res.redirect("/gui");
});

app.get("/gui", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
})

app.post("/generate", (req, res) => {
    const config = req.body;
    const data = calc(config);
    exportCsv(data);
    const response = {
        "message" : "Schedule regenerated",
        "schedule" : data.schedule,
        "totals" : data.count,
    };
    res.status(200).send(response);
});

app.listen(port, () => {
    console.log("Server attivo sulla porta: "+port);
})