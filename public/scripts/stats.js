const formattedDateOptions = {
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
};

const formatDate = (date) => {
  return new Date(date).toLocaleString("en-US", formattedDateOptions);
};

const handleSubmit = (e) => {
  e.preventDefault();
  //receive the form input origUrl value
  const userIdVal = document.getElementById("userId").value;
  const episodeIdVal = document.getElementById("episodeId").value;
  const shortUrlVal = document.getElementById("shortUrl").value;

  let postBody = userIdVal
    ? `{"userId": "${userIdVal}"}`
    : episodeIdVal
    ? `{"episodeId": "${episodeIdVal}"}`
    : `{"shortUrl": "${shortUrlVal}"}`;

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: postBody,
  };

  fetch(`/api/stats/`, options)
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        console.log("error");
        document.getElementById("stat-results").innerHTML = `${data.error}`;
      } else {
        let items = "";
        data.forEach((url) => {
          let item = `<div class="result">`;

          if (url.origUrl) {
            item += `<p><span class="bold">Original URL</span>: <a href="${url.origUrl}" target="_blank" id="stats-origUrl">${url.origUrl}</a></p>`;
          }
          if (url.shortUrl) {
            item += `<p><span class="bold">Short URL</span>: <a href="${url.shortUrl}" target="_blank" id="stats-shortUrl">${url.shortUrl}</a></p>`;
          }
          if (url.episodeName) {
            item += `<p><span class="bold">Episode</span>: <span id="stats-episodeName">${url.episodeName}</span></p>`;
          }
          if (url.clicks) {
            item += `<p><span class="bold">Clicks</span>: <span id="stats-clicks">${url.clicks}</span></p>`;
          }
          if (url.urlStats) {
            let clicksByDate = [];
            url.urlStats.forEach((stat, i) => {
              const date = new Date(stat.accessDate);
              const month = date.getMonth() + 1; // Add 1 because getMonth() returns 0-indexed months
              const day = date.getDate();
              const formattedDate = `${month}/${day}`;

              const index = clicksByDate.findIndex(
                (item) => item.date === formattedDate
              );
              if (index === -1) {
                // If this date hasn't been added yet, create a new object with count = 1
                clicksByDate.push({ date: formattedDate, count: 1 });
              } else {
                // If this date already exists in clicksByDate, increment its count
                clicksByDate[index].count++;
              }
            });
            //console.log(clicksByDate);
            new Chart(document.getElementById("stat-chart"), {
              type: "line",
              data: {
                labels: clicksByDate.map((row) => row.date),
                datasets: [
                  {
                    label: "Clicks by day",
                    data: clicksByDate.map((row) => row.count),
                  },
                ],
              },
            });
          }
        });
        document.getElementById("stat-results").innerHTML = items;
      }
      showOutput();
    });
};

const showOutput = () => {
  document.getElementById("output").classList.toggle("hidden", false);
};

const clearRetrievalVals = () => {
  document.getElementById("userId").value = "";
  document.getElementById("episodeId").value = "";
  document.getElementById("shortUrl").value = "";
};

const handleRetrievalMethodSelect = (e) => {
  clearRetrievalVals();
  const currentButtonId = e.target.dataset.id;
  document.querySelectorAll(".form-method").forEach((el) => {
    if (el.dataset.id === currentButtonId) {
      el.classList.toggle("hidden", false);
    } else {
      el.classList.toggle("hidden", true);
    }
  });
};

window.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("linkStatsForm")
    .addEventListener("submit", function (e) {
      e.preventDefault(); // before the code
      handleSubmit(e);
    });

  document.querySelectorAll(".retrieval-method").forEach((el) => {
    el.addEventListener("click", function (e) {
      e.preventDefault(); // before the code
      handleRetrievalMethodSelect(e);
    });
  });
});