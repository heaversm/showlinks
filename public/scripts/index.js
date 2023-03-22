const handleSubmit = (e) => {
  e.preventDefault();
  //receive the form input origUrl value
  const inputVal = document.getElementById("origUrl").value;
  // console.log(inputVal);

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: `{"origUrl": "${inputVal}"}`,
  };

  fetch(`/api/short/`, options)
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        console.log("error");
      } else {
        //console.log(data);
        document.getElementById(
          "shortUrl"
        ).innerHTML = `<a href="${data.shortUrl}" target="_blank">${data.shortUrl}</a>`;
      }
    });
};

window.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("linkCreatorForm")
    .addEventListener("submit", function (e) {
      e.preventDefault(); // before the code
      handleSubmit(e);
    });
});
