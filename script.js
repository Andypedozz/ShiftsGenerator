/**
 * Function to collect inputs from HTML and send them to server
 */
function sendData() {
    const config = {};
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

    fetch("/generate", {
        method: "POST",
        headers : {
            "Content-Type" : "application/json",
        },
        body : JSON.stringify(config)
    })
    .then(response => response.json())
    .then(res => {
        alert(res.message);
        fetchData(res);
    })
}

function clear() {
    const scheduleContainer = document.getElementById("schedule-container");
    const totalsContainer = document.getElementById("totals-container");

    if(scheduleContainer.hasChildNodes) {
        while(scheduleContainer.firstChild) {
            scheduleContainer.removeChild(scheduleContainer.firstChild);
        }
    }

    if(totalsContainer.hasChildNodes) {
        while(totalsContainer.firstChild) {
            totalsContainer.removeChild(totalsContainer.firstChild);
        }
    }
}

function fetchData(data) {
    clear();
    renderSchedule(data.schedule)
    renderTotals(data.totals);
}

function renderSchedule(schedule) {
    const container = document.getElementById("schedule-container");

    let i = 1;
    schedule.forEach(day => {
        const div = document.createElement("div");
        if(day["dayName"] == "Martedi") {
            div.setAttribute("class","tuesday-div");
        }else{
            div.setAttribute("class","day-div");
        }
        const label = document.createElement("label");
        label.innerText = day["dayName"]+" "+day["dayNumber"];
        const p = document.createElement("p");
        let text = "";
        day["riders"].forEach(rider => {
            text += rider+"<br>";
        });
        p.innerHTML = text;
        div.appendChild(label);
        div.appendChild(p);
        container.appendChild(div);
        i++;
    });
}

function renderTotals(totals) {
    const container = document.getElementById("totals-container");

    const div = document.createElement("div");
    const div2 = document.createElement("div");
    const h2 = document.createElement("h2");
    h2.innerText = "Totale turni:";
    const riders = Object.keys(totals);
    let text = "";
    riders.forEach(rider => {
        text += rider + ": " + totals[rider] + "<br>";
    })
    div2.innerHTML = text;
    div.appendChild(h2);
    div.appendChild(div2);
    container.appendChild(div);
}

