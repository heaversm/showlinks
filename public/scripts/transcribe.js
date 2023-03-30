const init = () => {
  transcribeAudio();
};

const transcribeAudio = () => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      msg: "hello", //temp
    }),
  };

  fetch(`/api/transcribe/`, options)
    .then((res) => res.json())
    .then((data) => {
      //console.log(data); // Handle the response data as needed
      const file = new Blob([data.transcript], { type: "text/html" });
      // Others
      const a = document.createElement("a");
      const url = window.URL.createObjectURL(file);
      a.href = url;
      a.download = "transcript.srt";
      a.click();
      console.log("transcript saved");
      window.URL.revokeObjectURL(url);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};

window.addEventListener("DOMContentLoaded", function () {
  init();
});
