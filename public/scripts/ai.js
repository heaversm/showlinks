let method;

const init = () => {
  addEventListeners();
};

const submitTranscriptToAI = () => {
  const postBody = `{"transcript": "test"}`;

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: postBody,
  };

  fetch(`/api/aitranscript/`, options)
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        console.log(data.error);
      } else {
        console.log(data);
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const addEventListeners = () => {
  document.getElementById("aiForm").addEventListener("submit", function (e) {
    e.preventDefault(); // before the code
    console.log("submit");
    submitTranscriptToAI();
  });
};

window.addEventListener("DOMContentLoaded", function () {
  init();
});
