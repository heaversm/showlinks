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

const submitRadFile = (options) => {
  //TODO: status message that we are submitting file
  fetch(`/api/writeRad/`, options)
    .then((response) => response.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "rad-file.mp3";
      a.click();
      URL.revokeObjectURL(url);
    });
};

const addEventListeners = () => {
  document.getElementById("radForm").addEventListener("submit", function (e) {
    e.preventDefault(); // before the code
    const formData = new FormData();
    formData.append("method", method);

    if (method && method === "file") {
      console.log("file");
      const file = document.getElementById("audioFile").files[0];
      if (!file) {
        console.log("no file provided");
        return;
      }
      formData.append("file", file);
      const audio = new Audio();

      audio.addEventListener("loadedmetadata", () => {
        const duration = audio.duration;
        console.log("Duration:", duration); // Duration in seconds
        formData.append("duration", duration);
        // console.log("Duration:", duration); // Duration in seconds
        const options = {
          method: "POST",
          body: formData,
        };
        submitRadFile(options);
      });
      audio.addEventListener("error", (error) => {
        console.error("Error loading audio:", error);
      });
      const fileUrl = URL.createObjectURL(file);
      audio.src = fileUrl;
      // audio.load();
      console.log("audio", audio);
    } else if (method && method === "url") {
      const url = document.getElementById("audioURL").value;
      console.log("url", url);

      if (!url) {
        console.log("no url provided");
        return;
      }
      formData.append("url", url);
      //TODO: status message that we are obtaining duration
      const audio = new Audio(url);
      audio.addEventListener("loadedmetadata", () => {
        const duration = audio.duration;
        formData.append("duration", duration);
        // console.log("Duration:", duration); // Duration in seconds
        const options = {
          method: "POST",
          body: formData,
        };
        submitRadFile(options);
      });
      audio.addEventListener("error", (error) => {
        console.error("Error loading audio:", error);
      });

      // Start loading the audio
      audio.load();
    }
  });
  document
    .getElementById("method")
    .addEventListener("change", handleMethodChange);
};

window.addEventListener("DOMContentLoaded", function () {
  init();
});
