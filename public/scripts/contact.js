const init = () => {
  addListeners();
};

const addListeners = () => {
  document
    .getElementById("contactForm")
    .addEventListener("submit", function (e) {
      e.preventDefault(); // before the code
      handleSubmit();
    });
};

const clearMessages = () => {
  document.getElementById("error").innerHTML = "";
  document.getElementById("success").innerHTML = "";
};

const handleSubmit = () => {
  clearMessages();
  const form = document.getElementById("contactForm");
  const formData = new URLSearchParams(new FormData(form));

  // Post the form data to the API endpoint
  fetch("api/contact", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        console.log(data.error);
        document.getElementById("error").innerHTML = data.error;
      } else {
        document.getElementById("success").innerHTML = data.message;
      }
    })
    .catch((error) => {
      // Handle any errors that occur during the API request
      console.error("Error submitting form:", error);
      document.getElementById("error").innerHTML = "Error submitting form";
    });
};

window.addEventListener("DOMContentLoaded", function () {
  init();
});
