const init = () => {
  checkForUserId();
  initTextArea();
  addListeners();
};

const checkForUserId = () => {
  const userId = getUserIdFromLocalStorage();
  if (userId && userId.length) {
    document.getElementById("userId").value = userId;
  } else {
    console.log("no user id");
  }
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

const replaceLinks = (editorRef, origUrls, shortUrls) => {
  for (const url in shortUrls) {
    editorRef.querySelectorAll(`a[href="${origUrls[url]}"]`).forEach((el) => {
      el.href = shortUrls[url].shortUrl;
    });
  }
};

const handleSubmit = (e) => {
  const editorRef = document.querySelector(".ql-editor");
  const editorContent = editorRef.innerHTML;
  const origUrls = extractLinks(editorContent);
  const userIdVal = document.getElementById("userId").value || "";
  const episodeNameVal = document.getElementById("episodeName").value || "";

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      origUrls: origUrls,
      userId: userIdVal,
      episodeName: episodeNameVal,
    }),
  };

  fetch(`/api/short/`, options)
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        document.getElementById("shortUrl").innerHTML = `${data.error}`;
      } else {
        if (data.shortUrls && data.shortUrls.length) {
          let output = "";
          for (const url of data.shortUrls) {
            output += `<p class="url-item"><span class="output-label">Original URL: </span><a><href="${url.origUrl}" target="_blank">${url.origUrl}</a><br/><span class="output-label">Short URL: </span><span><a class="short-url" href="${url.shortUrl}" target="_blank">${url.shortUrl}</a></p>`;
          }
          document.getElementById("outputShortUrl").innerHTML = output;
          replaceLinks(editorRef, origUrls, data.shortUrls);
          document.getElementById(
            "outputMsg"
          ).innerHTML = `<p class="success">Success</p><p class="instructions">You can copy and paste your Show Notes above into wherever you host your podcast. Visit the "Get Stats" page to see who is interacting with your Show Notes. </p>`;
        } else {
          document.getElementById(
            "outputMsg"
          ).innerHTML = `<p class="error">Error</p><p class="instructions">No short URLs generated</p>`;
          document.getElementById("outputShortUrl").innerHTML = "<p>None</p>";
        }

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
        addUserIdToLocalStorage(data.userId);
        hideGetUserIdButton();
      }
    });
};

const addUserIdToLocalStorage = (userId) => {
  if (localStorage) {
    localStorage.setItem("shownotesUserId", userId);
  }
};

const getUserIdFromLocalStorage = () => {
  if (localStorage) {
    return localStorage.getItem("shownotesUserId");
  } else {
    return null;
  }
};

const hideGetUserIdGroup = () => {
  document.getElementById("userIdGroup").classList.toggle("hidden", true);
};

const hideGetUserIdButton = () => {
  document.getElementById("getUserId").classList.toggle("hidden", true);
};

const showOutput = () => {
  document.getElementById("output").classList.toggle("hidden", false);
};

window.addEventListener("DOMContentLoaded", function () {
  init();
});
