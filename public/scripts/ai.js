let method;

const init = () => {
  addEventListeners();
};

const submitLinkToAI = (aiForm) => {
  const link = document.getElementById("link").value;
  console.log(link);
  const aiFormData = new URLSearchParams(new FormData(aiForm));

  const options = {
    method: "POST",
    body: aiFormData,
  };

  const statusField = document.getElementById("fileStatus");

  fetch(`/api/aiLink/`, options)
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

const submitTranscriptToAI = (e) => {
  const inputFile = document.getElementById("file");
  const statusField = document.getElementById("fileStatus");
  if (!inputFile?.files) {
    statusField.innerHTML = "No file selected";
    return;
  }
  const file = inputFile.files[0];
  statusField.innerHTML = "Analyzing";

  const formData = new FormData();
  formData.append("file", file || "");
  const format = document.getElementById("format").value;
  formData.append("format", format || "");
  const link = document.getElementById("link").value;
  formData.append("link", link || "");

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
  document.getElementById(elementId).classList.toggle("hidden", !visible);
};

const addEventListeners = () => {
  const aiForm = document.getElementById("aiForm");
  aiForm.addEventListener("submit", function (e) {
    e.preventDefault();
    //get format to determine if link or file
    const format = document.getElementById("format").value;
    if (format === "link") {
      submitLinkToAI(aiForm);
    } else {
      submitTranscriptToAI(e);
    }
  });

  document
    .getElementById("formatSelect")
    .addEventListener("change", function (e) {
      e.preventDefault();
      const format = document.getElementById("format").value;
      // console.log("change", format);
      if (format === "link") {
        document.getElementById("linkSubmit").classList.toggle("hidden", false);
        document.getElementById("fileSubmit").classList.toggle("hidden", true);
      } else if (format === "transcript") {
        document.getElementById("file").accept = ".txt";
        document.getElementById("fileSubmit").classList.toggle("hidden", false);
        document.getElementById("linkSubmit").classList.toggle("hidden", true);
      } else if (format === "mp3") {
        document.getElementById("file").accept = ".mp3";
        document.getElementById("fileSubmit").classList.toggle("hidden", false);
        document.getElementById("linkSubmit").classList.toggle("hidden", true);
      }
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
