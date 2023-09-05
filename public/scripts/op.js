console.log("op.js loaded");

const CONFIG = {
  TRIGGER_AUTO_REQUEST: true, //when true, generate requests via LLM / AI vs user input
};

const toggleRequestModal = function (isActive) {
  document.body.classList.toggle("js__request-active", isActive); //show or hide request modal
};

const toggleRequestButton = function (isActive) {
  document.body.classList.toggle("js__request-button-active", isActive); //show request button (when LLM is ready)
};

const getRequestsFromDB = function () {
  const options = {
    method: "GET",
  };

  fetch(`/api/getRequests/`, options)
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};

const establishLLM = function () {
  console.log("establishing llm");

  const options = {
    method: "GET",
  };

  fetch(`/api/establishLLM/`, options)
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      if (data.ready) {
        toggleRequestButton(true);
      } else {
        console.log("problem establishing llm");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};

const populateRequestModal = function (request) {
  //take the data from our LLM and populate the form
  const request__title = document.getElementById("request__title");
  const request__description = document.getElementById("request__description");
  const request__category = document.getElementById("request__category");
  const request__priority = document.getElementById("request__priority");
  const request__username = document.getElementById("request__username");

  // const requestCategoryString = request.request_category.toString();
  // request__category.value = requestCategoryString.toLowerCase();

  request__title.value = request.request_title;
  request__description.value = request.request_body;
  request__username.value = request.request_username;
  request__category.value = request.request_category.toLowerCase();
  request__priority.value = request.request_priority.toLowerCase();
};

const generateRequest = function () {
  //get the LLM to generate form data
  console.log("generating request");

  const options = {
    method: "GET",
  };

  fetch(`/api/generateRequest/`, options)
    .then((res) => res.json())
    .then((data) => {
      const { request } = data;
      if (request) {
        console.log(request);
        populateRequestModal(request);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};

const triggerAutoRequest = function (delay = 0) {
  setTimeout(generateRequest, delay);
};

const onRequestButtonClick = function () {
  toggleRequestModal(true);
  if (CONFIG.TRIGGER_AUTO_REQUEST) {
    triggerAutoRequest(500);
  }
};

const onRequestCloseClick = function () {
  toggleRequestModal(false);
};

const addEventListeners = function () {
  document
    .getElementById("request__button")
    .addEventListener("click", onRequestButtonClick);

  document
    .getElementById("request__button-close")
    .addEventListener("click", onRequestCloseClick);
};

const init = function () {
  addEventListeners();
  establishLLM();
  getRequestsFromDB();
};

init();
