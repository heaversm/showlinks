console.log("stats");
const handleSubmit = (e) => {
  e.preventDefault();
  //receive the form input origUrl value
  const inputVal = document.getElementById("shortUrl").value;

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: `{"shortUrl": "${inputVal}"}`,
  };

  fetch(`/api/stats/`, options)
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        console.log("error");
        document.getElementById("stats-clicks").innerHTML = `${data.error}`;
      } else {
        //console.log(data);
        document.getElementById("stats-clicks").innerHTML = `${data.clicks}`;
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
});
