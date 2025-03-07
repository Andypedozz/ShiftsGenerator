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