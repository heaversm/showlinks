let method;

const init = () => {
  addEventListeners();
};

const submitTranscriptToAI = (e) => {
  const inputFile = document.getElementById("file");
  const statusField = document.getElementById("fileStatus");
  if (!inputFile?.files) {
    statusField.innerHTML = "No file selected";
    return;
  }
  const file = inputFile.files[0];
  statusField.innerHTML = "Studying transcript";

  const formData = new FormData();
  formData.append("file", file);

  const options = {
    method: "POST",
    body: formData,
  };

  fetch(`/api/aitranscript/`, options)
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        console.log(data.error);
        statusField.innerHTML = data.error;
      } else {
        console.log(data);
        toggleVisibility("qaFormContainer", true);
        toggleVisibility("aiTranscriptContainer", false);
        statusField.innerHTML = "";
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
    submitTranscriptToAI(e);
  });

  const qaForm = document.getElementById("qaForm");
  qaForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const qaFormData = new URLSearchParams(new FormData(qaForm));
    //const qaFormData = new FormData(qaForm);

    fetch("api/qa/", {
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
        document.getElementById("qaError").innerHTML =
          "Error submitting form: " + error;
      });
  });
};

window.addEventListener("DOMContentLoaded", function () {
  init();
});
