let method;

const init = () => {
  addEventListeners();
  //transcribeAudio();
};

const handleMethodChange = (e) => {
  method = e.target.value;
  if (method && method === "url") {
    document.getElementById("fg-upload-url").classList.toggle("hidden", false);
    document.getElementById("fg-upload-file").classList.toggle("hidden", true);
  } else {
    document.getElementById("fg-upload-url").classList.toggle("hidden", true);
    document.getElementById("fg-upload-file").classList.toggle("hidden", false);
  }
  document.getElementById("fg-submit").classList.toggle("hidden", false);
};

const addEventListeners = () => {
  document.getElementById("radForm").addEventListener("submit", function (e) {
    e.preventDefault(); // before the code
    console.log("submit", method);
    const formData = new FormData();

    if (method && method === "file") {
      const file = document.getElementById("audioFile").files[0];
      if (!file) {
        console.log("no file provided");
        return;
      }

      formData.append("file", file);
    } else if (method && method === "url") {
      const url = document.getElementById("audioURL").value;
      console.log("url", url);
      if (!url) {
        console.log("no url provided");
        return;
      }
      formData.append("url", url);
    }

    //COMMON
    formData.append("method", method);
    const options = {
      method: "POST",
      // headers: {
      //   "Content-Type": "application/json",
      // },
      body: formData,
    };
    fetch(`/api/writeRad/`, options)
      //.then((res) => res.json())
      // .then((data) => {
      //   console.log(data);
      // });
      .then((response) => response.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "rad-file.mp3";
        a.click();
        URL.revokeObjectURL(url);
      });
  });
  document
    .getElementById("method")
    .addEventListener("change", handleMethodChange);
};

window.addEventListener("DOMContentLoaded", function () {
  init();
});
