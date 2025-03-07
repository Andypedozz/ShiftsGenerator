const daysOfWeek = ["Lunedi", "Martedi", "Mercoledi", "Giovedi", "Venerdi", "Sabato", "Domenica"];

let config = {};
let schedule;
let count;
let daysOfMonth;

/*******************************************/
/*                FUNCTIONS                */
/*******************************************/

function loadConfig() {
    const daysRange = [];
    const riders = [];
    const weeklyNeeds = {};

    // Collect Days Range
    daysRange.push(document.getElementById("fStartDay").value);
    daysRange.push(document.getElementById("fEndDay").value);

    // Collect Riders
    const riderNames = [
        document.getElementById("fRider1").value,
        document.getElementById("fRider2").value,
        document.getElementById("fRider3").value,
        document.getElementById("fRider4").value,
        document.getElementById("fRider5").value,
    ];

    const riderDays = [
        document.getElementById("daysOff1").value.split(","),
        document.getElementById("daysOff2").value.split(","),
        document.getElementById("daysOff3").value.split(","),
        document.getElementById("daysOff4").value.split(","),
        document.getElementById("daysOff5").value.split(","),
    ]

    for(let i = 0; i < 5; i++) {
        riders.push({ "name" : riderNames[i], "requestedDaysOff" : riderDays[i]});
    }

    // Collect Weekly needs
    weeklyNeeds["Lunedi"] = parseInt(document.getElementById("need1").value);
    weeklyNeeds["Martedi"] = parseInt(document.getElementById("need2").value);
    weeklyNeeds["Mercoledi"] = parseInt(document.getElementById("need3").value);
    weeklyNeeds["Giovedi"] = parseInt(document.getElementById("need4").value);
    weeklyNeeds["Venerdi"] = parseInt(document.getElementById("need5").value);
    weeklyNeeds["Sabato"] = parseInt(document.getElementById("need6").value);
    weeklyNeeds["Domenica"] = parseInt(document.getElementById("need7").value);

    config["daysRange"] = daysRange;
    config["riders"] = riders;
    config["weeklyNeeds"] = weeklyNeeds;
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
    loadConfig();
    generateNumbers();
    schedule = generateMonthlySchedule();
    count = getShiftsCounts();
    clear();
    renderSchedule(schedule);
    renderTotals(count);
}

function generateMonthlySchedule() {
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
            const daySchedule = { weekIndex, dayName, dayNumber, riders: []};

            // Assegnamo Miky tutti i giorni tranne il martedì in quanto giorno libero
            if (dayName !== "Martedi" && !riders[0].requestedDaysOff.includes(dayNumber.toString())) {
                daySchedule.riders.push("Miky");
                shiftsCount["Miky"]++;
            }

            const requiredRiders = weeklyNeeds[dayName];
            const availableRiders = riders.filter(rider => {
                if(rider.name === "Miky" && day !== "Martedi") return false;
                if(rider.requestedDaysOff.includes(dayNumber.toString())) return false;
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