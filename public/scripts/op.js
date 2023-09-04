console.log("op.js loaded");

const onRequestButtonClick = function () {
  document.body.classList.toggle("js__request-active");
};

const addEventListeners = function () {
  document
    .getElementById("request__button")
    .addEventListener("click", onRequestButtonClick);
};

const init = function () {
  addEventListeners();
};

init();
