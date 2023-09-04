console.log("op.js loaded");

const toggleRequestModal = function (isActive) {
  document.body.classList.toggle("js__request-active", isActive);
};

const onRequestButtonClick = function () {
  toggleRequestModal(true);
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
};

init();
