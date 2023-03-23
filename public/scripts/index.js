const handleSubmit = (e) => {
  const inputVal = document.getElementById("origUrl").value;
  const userIdVal = document.getElementById("userId").value || "";
  const episodeNameVal = document.getElementById("episodeName").value || "";
  // console.log(inputVal);

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: `{
      "origUrl": "${inputVal}",
      "userId": "${userIdVal}",
      "episodeName": "${episodeNameVal}"
    }`,
  };

  fetch(`/api/short/`, options)
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        console.log("error");
        document.getElementById("shortUrl").innerHTML = `${data.error}`;
      } else {
        document.getElementById(
          "outputShortUrl"
        ).innerHTML = `<a href="${data.shortUrl}" target="_blank">${data.shortUrl}</a>`;

        document.getElementById("outputUserId").innerText = `${
          (data.userId && data.userId) || ""
        }`;
        document.getElementById("outputEpisodeId").innerText = `${
          (data.episodeId && data.episodeId) || ""
        }`;
      }
      showOutput();
    });
};

const handleGetUserIdClick = (e) => {
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  fetch(`/api/generateUserId/`, options)
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        console.log("error");
        document.getElementById("userId").value = `${data.error}`;
      } else {
        document.getElementById("userId").value = `${data.userId}`;
        hideGetUserId();
      }
    });
};

const hideGetUserId = () => {
  document.getElementById("getUserId").classList.toggle("hidden", true);
};

const showOutput = () => {
  document.getElementById("output").classList.toggle("hidden", false);
};

window.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("linkCreatorForm")
    .addEventListener("submit", function (e) {
      e.preventDefault(); // before the code
      handleSubmit();
    });
  document.getElementById("getUserId").addEventListener("click", function (e) {
    e.preventDefault(); // before the code
    handleGetUserIdClick();
  });
});
