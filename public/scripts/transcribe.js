let blobUrl; //will hold the srt file url for downloading so it can later be revoked for garbage collection

const init = () => {
  addEventListeners();
  //transcribeAudio();
};

const clearMessages = () => {
  document.getElementById("error").innerHTML = "";
  document.getElementById("success").innerHTML = "";
};

const addEventListeners = () => {
  document
    .getElementById("transcribeForm")
    .addEventListener("submit", function (e) {
      e.preventDefault(); // before the code
      transcribeAudio();
    });
  document.getElementById("file").addEventListener("change", function (e) {
    checkUploadSize(e);
  });
};

const checkUploadSize = (e) => {
  const audioFileInput = e.target;
  const file = audioFileInput.files[0];
  const maxFileSize = 10485760; // 10 MB

  if (file.size > maxFileSize) {
    // Display an error message or take other action as needed
    const errorMessage = "File size exceeds maximum limit";
    console.error(errorMessage);
    document.getElementById("error").innerHTML = errorMessage;
    audioFileInput.value = null;
  } else {
    clearMessages();
  }
};

const transcribeAudio = () => {
  clearMessages();
  const inputFile = document.getElementById("file");
  if (!inputFile?.files) {
    document.getElementById("error").innerHTML = "No file selected";
    return;
  }
  const file = inputFile.files[0];
  document.getElementById("success").innerHTML = "Generating transcript";

  const formData = new FormData();
  formData.append("file", file);
  const transcriptFormat = document.getElementById("format").value;
  const transcriptExt = transcriptFormat === "text" ? "txt" : transcriptFormat;
  formData.append("format", transcriptFormat);

  const options = {
    method: "POST",
    // headers: {
    //   "Content-Type": "application/json",
    // },
    body: formData,
  };

  fetch(`/api/transcribe/`, options)
    .then((res) => res.json())
    .then((data) => {
      console.log(data); // Handle the response data as needed
      const file = new Blob([data.transcript], { type: "text/html" });
      // Others
      const a = document.createElement("a");
      blobUrl = window.URL.createObjectURL(file);
      a.href = blobUrl;
      a.className = "download-button";
      a.download = `transcript.${transcriptExt}`;
      a.innerText = "Download Transcript";
      //a.click();
      a.addEventListener("click", handleFileDownloaded);
      document.getElementById("success").innerHTML = "Transcribed successfully";
      const transcriptDownloadGroup = document.getElementById(
        "transcript-download-group"
      );
      transcriptDownloadGroup.replaceChildren(a);
    })
    .catch((error) => {
      console.error("Error:", error);
      document.getElementById("error").innerHTML = "Error submitting form";
    });
};

const handleFileDownloaded = () => {
  setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
    document.getElementById("transcript-download-group").replaceChildren();
  }, 100);
};

window.addEventListener("DOMContentLoaded", function () {
  init();
});
