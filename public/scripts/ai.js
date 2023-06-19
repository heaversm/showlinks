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
        toggleVisibility("qaFormContainer", true);
        toggleVisibility("aiTranscriptContainer", false);
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const clearFormFields = (formName) => {
  document.getElementById(formName).reset();
};

const toggleVisibility = (elementId, visible) => {
  console.log(elementId, visible);
  document.getElementById(elementId).classList.toggle("hidden", !visible);
};

const addEventListeners = () => {
  document.getElementById("aiForm").addEventListener("submit", function (e) {
    e.preventDefault();
    console.log("submit");
    submitTranscriptToAI();
  });

  const qaForm = document.getElementById("qaForm");
  qaForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const qaFormData = new FormData(qaForm);
    fetch("api/qa", {
      method: "POST",
      body: qaFormData,
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Request failed with status " + res.status);
        }
        return res.json();
      })
      .then((data) => {
        if (data.error) {
          console.log(data.error);
          document.getElementById("qaError").innerHTML = data.error;
        } else {
          document.getElementById("qaOutput").innerHTML = data.message;
          clearFormFields("qaForm");
        }
      })
      .catch((error) => {
        // Handle any errors that occur during the API request
        console.error("Error submitting form:", error);
        document.getElementById("error").innerHTML = "Error submitting form";
      });
  });
};

window.addEventListener("DOMContentLoaded", function () {
  init();
});
