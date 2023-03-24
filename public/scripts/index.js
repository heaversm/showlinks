const init = () => {
  initTextArea();
  addListeners();
};

const initTextArea = () => {
  const quill = new Quill("#editor-container", {
    formats: [
      "bold",
      "italic",
      "underline",
      "strike",
      "link",
      "header",
      "list",
    ],
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, 4, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link"],
        ["clean"],
      ],
    },
    theme: "snow",
  });
};

const addListeners = () => {
  document
    .getElementById("linkCreatorForm")
    .addEventListener("submit", function (e) {
      e.preventDefault(); // before the code
      handleSubmit();
    });
  document.getElementById("getUserId").addEventListener("click", function (e) {
    e.preventDefault(); // before the code
    handleGetUserIdClick();
  });
};

const extractLinks = (editorContent) => {
  const regex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/g;
  const links = [];

  let match;
  while ((match = regex.exec(editorContent))) {
    links.push(match[2]);
  }
  return links;
};

const handleSubmit = (e) => {
  //const inputVal = document.getElementById("origUrl").value;
  const editorContent = document.querySelector(".ql-editor").innerHTML;
  const origUrls = extractLinks(editorContent);
  const userIdVal = document.getElementById("userId").value || "";
  const episodeNameVal = document.getElementById("episodeName").value || "";
  // console.log(inputVal);

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      origUrls: origUrls,
      //origUrl: inputVal,
      userId: userIdVal,
      episodeName: episodeNameVal,
    }),
  };

  fetch(`/api/short/`, options)
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        console.log("error");
        document.getElementById("shortUrl").innerHTML = `${data.error}`;
      } else {
        if (data.shortUrls && data.shortUrls.length) {
          let output = "";
          for (const url of data.shortUrls) {
            output += `<p class="url-item"><span class="orig-url">${url.origUrl}</span><br/><a class="short-url" href="${url.shortUrl}" target="_blank">${url.shortUrl}</a></p>`;
          }
          document.getElementById("outputShortUrl").innerHTML = output;
        }

        // document.getElementById(
        //   "outputShortUrl"
        // ).innerHTML = `<a href="${data.shortUrl}" target="_blank">${data.shortUrl}</a>`;

        document.getElementById("outputUserId").innerText = `${
          (data.userId && data.userId) || "None specified"
        }`;
        document.getElementById("outputEpisodeId").innerText = `${
          (data.episodeId && data.episodeId) || "None specified"
        }`;
      }
      showOutput();
    });
};

const handleGetUserIdClick = (e) => {
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  fetch(`/api/generateUserId/`, options)
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        console.log("error");
        document.getElementById("userId").value = `${data.error}`;
      } else {
        document.getElementById("userId").value = `${data.userId}`;
        hideGetUserId();
      }
    });
};

const hideGetUserId = () => {
  document.getElementById("getUserId").classList.toggle("hidden", true);
};

const showOutput = () => {
  document.getElementById("output").classList.toggle("hidden", false);
};

window.addEventListener("DOMContentLoaded", function () {
  init();
});
