console.log("stats");
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
          if (url.episodeId) {
            item += `<p><span class="bold">Episode</span>: <span id="stats-episodeId">${url.episodeId}</span></p>`;
          }
          if (url.clicks) {
            item += `<p><span class="bold">Clicks</span>: <span id="stats-clicks">${url.clicks}</span></p>`;
          }
          item += `</div>`;
          items += item;
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
