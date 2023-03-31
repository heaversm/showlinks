const init = () => {
  addListeners();
  getCSRF();
};

const getCSRF = () => {
  fetch("api/csrf", { method: "GET" })
    .then((res) => res.json())
    .then((data) => {
      // Add the CSRF token as a hidden form field
      const csrfToken = document.createElement("input");
      csrfToken.setAttribute("type", "hidden");
      csrfToken.setAttribute("name", "_csrf");
      csrfToken.setAttribute("value", data.token);
      document.getElementById("contactForm").appendChild(csrfToken);
    })
    .catch((error) => {
      // Handle any errors that occur during the API request
      console.error("Error getting CSRF token:", error);
    });
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

const clearFormFields = () => {
  document.getElementById("contactForm").reset();
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
        clearFormFields();
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
