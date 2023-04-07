let canvasRef;

const init = () => {
  addListeners();
};

const addListeners = () => {
  document
    .getElementById("linkStatsForm")
    .addEventListener("submit", function (e) {
      e.preventDefault(); // before the code
      handleSubmit(e);
    });

  document.querySelectorAll(".retrieval-method").forEach((el) => {
    el.addEventListener("click", function (e) {
      e.preventDefault(); // before the code
      handleRetrievalMethodSelect(e);
    });
  });
};

const checkForUserId = () => {
  const userId = getUserIdFromLocalStorage();
  if (userId && userId.length) {
    document.getElementById("userId").value = `${userId}`;
  }
};

const getUserIdFromLocalStorage = () => {
  if (localStorage) {
    return localStorage.getItem("shownotesUserId");
  } else {
    return null;
  }
};

//Brutal...https://codepen.io/heaversm/pen/eYLqbpo?editors=0011

const sortByDate = (dateArray) => {
  dateArray.sort((a, b) => {
    const dateA = new Date("2022/" + a.date).getTime();
    const dateB = new Date("2022/" + b.date).getTime();
    return dateA - dateB;
  });
  return dateArray;
};

const constructUrlFooter = (data) => {
  let footer = "";
  const { browsers, devices, operatingSystems, hosts } = data;
  if (browsers?.length) {
    browsers.forEach((browser) => {
      footer += `${browser.name}: ${browser.count}\r\n`;
    });
    footer += `\r\n`;
  }
  if (devices?.length) {
    devices.forEach((device) => {
      footer += `${device.name}: ${device.count}\r\n`;
    });
    footer += `\r\n`;
  }
  if (operatingSystems?.length) {
    operatingSystems.forEach((os) => {
      footer += `${os.name}: ${os.count}\r\n`;
    });
    footer += `\r\n`;
  }
  if (hosts?.length) {
    hosts.forEach((host) => {
      footer += `${host.name}: ${host.count}\r\n`;
    });
  }
  return footer;
};

const constructLinkDetails = (url) => {
  // console.log(url);
  let stat = `
    <div class="result">
      ${
        url.origUrl &&
        `<p>
        <span class="bold">Original URL</span>:
        <a href="${url.origUrl}" target="_blank" class="stats-origUrl">${url.origUrl}</a>
      </p>`
      }
      ${
        url.shortUrl &&
        `<p>
        <span class="bold">Short URL</span>: 
        <a href="${url.shortUrl}" target="_blank" class="stats-shortUrl">${url.shortUrl}</a>
      </p>`
      }
      ${
        url.episodeName &&
        `<p>
        <span class="bold">Episode</span>: 
        <span class="stats-episodeName">${url.episodeName}</span>
      </p>`
      }
      <p>
        <span class="bold">Clicks</span>: 
        <span class="stats-clicks">${url.clicks || 0}</span>
      </p>
    </div>
  `;
  return stat;
};

const constructStatsGraph = (clicksByDate) => {
  canvasRef = new Chart(document.getElementById("stat-chart"), {
    type: "line",
    options: {
      responsive: true,
      scales: {
        y: {
          min: 0,
          beginAtZero: true,
          grace: 1,
          ticks: {
            stepSize: 1,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              // console.log(context);
              return `Clicks: ${context.formattedValue}`;
            },
            footer: function (context) {
              // console.log(context);
              let footer = "";
              if (context?.length) {
                footer = "\r\n";
                footer = constructUrlFooter(context[0].raw);
              }
              return footer;
            },
          },
        },
      },
      parsing: {
        xAxisKey: "date",
        yAxisKey: "count",
      },
    },
    data: {
      labels: clicksByDate.map((row) => row.date),
      datasets: [
        {
          data: clicksByDate,
        },
      ],
    },
  });
};

const constructLinksGraph = (clicksByLink) => {
  //TODO: getting duplicates in array which leads to incorrect graphs, see "TheNeedForRepairabilityData" which should have a click on the 27th
  const chartData = [];
  //create an array of all dates in each link

  let allDates = [];

  clicksByLink.forEach((link) => {
    link.clicksByDate?.forEach((date) => {
      const dateExists = allDates.find((d) => {
        return d === date.date;
      });
      if (!dateExists) {
        allDates.push(date.date);
      }
    });
  });

  allDates = allDates.sort((a, b) => {
    const dateA = new Date("2022/" + a).getTime();
    const dateB = new Date("2022/" + b).getTime();
    return dateA - dateB;
  });

  clicksByLink.forEach((link) => {
    for (let i = 0; i < allDates.length; i++) {
      const curDate = allDates[i];
      const index = link.clicksByDate?.findIndex(
        (clickByDate) => clickByDate.date === curDate
      );
      if (index === -1) {
        link.clicksByDate?.push({ date: curDate, count: 0 });
      }
    }
  });

  clicksByLink.forEach((link) => {
    if (link.clicksByDate) {
      link.clicksByDate = sortByDate(link.clicksByDate);
      chartData.push({
        label: link.urlId,
        data: link.clicksByDate.map((row) => row.count),
      });
    }
  });

  if (canvasRef) {
    canvasRef.destroy();
  }

  canvasRef = new Chart(document.getElementById("stat-chart"), {
    type: "line",
    options: {
      responsive: true,
      scales: {
        y: {
          min: 0,
          beginAtZero: true,
          grace: 1,
          ticks: {
            stepSize: 1,
          },
        },
      },
    },
    data: {
      labels: allDates,
      datasets: chartData,
    },
  });
};

constructFormattedDate = (accessDate) => {
  const date = new Date(accessDate);
  const month = date.getMonth() + 1; // Add 1 because getMonth() returns 0-indexed months
  const day = date.getDate();
  const formattedDate = `${month}/${day}`;
  return formattedDate;
};

constructClicksByDate = (data) => {
  let linkDetails = "";
  let clicksByDate = [];
  data.forEach((url) => {
    const linkDetail = constructLinkDetails(url);
    linkDetails += linkDetail;
    if (url.urlStats && url.urlStats.length) {
      url.urlStats.forEach((stat, i) => {
        const formattedDate = constructFormattedDate(stat.accessDate);
        const statHost = stat.host || "Unknown";

        const index = clicksByDate.findIndex(
          (item) => item.date === formattedDate
        );
        if (index === -1) {
          // If this date hasn't been added yet, create a new object with count = 1

          clicksByDate.push({
            date: formattedDate,
            count: 1,
            browsers: [{ name: stat.browser, count: 1 }],
            operatingSystems: [{ name: stat.os, count: 1 }],
            devices: [{ name: stat.device, count: 1 }],
            hosts: [{ name: statHost, count: 1 }],
          });
        } else {
          // If this date already exists in clicksByDate, increment its count
          const item = clicksByDate[index];
          item.count++;
          const browser = item.browsers.find((x) => x.name === stat.browser);
          if (!browser) {
            item.browsers.push({ name: stat.browser, count: 1 });
          } else {
            browser.count += 1;
          }
          const os = item.operatingSystems.find((x) => x.name === stat.os);
          if (!os) {
            item.operatingSystems.push({ name: stat.os, count: 1 });
          } else {
            os.count += 1;
          }
          const device = item.devices.find((x) => x.name === stat.device);
          if (!device) {
            item.devices.push({ name: stat.device, count: 1 });
          } else {
            device.count += 1;
          }
          const host = item.hosts.find((x) => x.name === statHost);
          if (!host) {
            item.hosts.push({ name: statHost, count: 1 });
          } else {
            host.count += 1;
          }
        }
      });
    }
  });
  return { linkDetails, clicksByDate };
};

//Brutal...https://codepen.io/heaversm/pen/eYLqbpo?editors=0011

constructClicksByLink = (data) => {
  let linkDetails = "";

  data.forEach((url) => {
    const linkDetail = constructLinkDetails(url);
    linkDetails += linkDetail;
    if (url.urlStats && url.urlStats.length) {
      url.clicksByDate = [];
      url.urlStats.forEach((stat, i) => {
        const formattedDate = constructFormattedDate(stat.accessDate);

        const index = url.clicksByDate.findIndex(
          (item) => item.date === formattedDate
        );
        if (index === -1) {
          // If this date hasn't been added yet, create a new object with count = 1
          url.clicksByDate.push({
            date: formattedDate,
            count: 1,
            browsers: [{ name: stat.browser, count: 1 }],
            operatingSystems: [{ name: stat.os, count: 1 }],
            devices: [{ name: stat.device, count: 1 }],
            hosts: [{ name: stat.host, count: 1 }],
          });
        } else {
          // If this date already exists in clicksByDate, increment its count
          const item = url.clicksByDate[index];
          item.count++;
          const browser = item.browsers.find((x) => x.name === stat.browser);
          if (!browser) {
            item.browsers.push({ name: stat.browser, count: 1 });
          } else {
            browser.count += 1;
          }
          const os = item.operatingSystems.find((x) => x.name === stat.os);
          if (!os) {
            item.operatingSystems.push({ name: stat.os, count: 1 });
          } else {
            os.count += 1;
          }
          const device = item.devices.find((x) => x.name === stat.device);
          if (!device) {
            item.devices.push({ name: stat.device, count: 1 });
          } else {
            device.count += 1;
          }

          const host = item.hosts.find((x) => x.name === stat.host);
          if (!host) {
            item.hosts.push({ name: stat.host, count: 1 });
          } else {
            host.count += 1;
          }
        }
      });
    }
  });
  return { linkDetails, data };
};

const getStatsByMethod = (statsMethod) => {
  let postBody;
  if (statsMethod === "userId") {
    postBody = `{"userId": "${document.getElementById("userId").value}"}`;
  } else if (statsMethod === "episodeId") {
    postBody = `{"episodeId": "${document.getElementById("episodeId").value}"}`;
  } else {
    postBody = `{"shortUrl": "${document.getElementById("shortUrl").value}"}`;
  }
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: postBody,
  };

  fetch(`/api/stats/`, options)
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        showError(true, data.error);
      } else {
        if (statsMethod === "episodeId") {
          let linkDetails = "";
          let clicksByLink = [];
          const clicksByLinkResponse = constructClicksByLink(data);
          linkDetails = clicksByLinkResponse.linkDetails;
          clicksByLink = clicksByLinkResponse.data;
          document.getElementById("stat-results").innerHTML = linkDetails;
          showError(false);
          constructLinksGraph(clicksByLink);
        } else {
          let linkDetails = "";
          let clicksByDate = [];
          const clicksByDateResponse = constructClicksByDate(data);
          linkDetails = clicksByDateResponse.linkDetails;
          clicksByDate = clicksByDateResponse.clicksByDate;
          if (canvasRef) {
            canvasRef.destroy();
          }

          if (clicksByDate && clicksByDate.length) {
            clicksByDate = sortByDate(clicksByDate);
            constructStatsGraph(clicksByDate);
          }

          if (statsMethod === "userId") {
            // console.log(data);
            constructEpisodeDropdown(data);
          }
          document.getElementById("stat-results").innerHTML = linkDetails;
          showError(false);
        }
      }
    });
};

const handleSubmit = (e) => {
  e.preventDefault();
  //receive the form input origUrl value
  const userIdVal = document.getElementById("userId").value;
  const episodeIdVal = document.getElementById("episodeId").value;
  let statsMethod = userIdVal
    ? "userId"
    : episodeIdVal
    ? "episodeId"
    : "shortUrl";

  getStatsByMethod(statsMethod);
};

constructEpisodeDropdown = (data) => {
  let episodes = `<p class="instructions">Filter by episode</p><select name="episodeFilter" id="episodeFilter"><option disabled selected value> -- select an episode -- </option>`;
  const uniqueEpisodes = _.uniqBy(data, "episodeId");
  uniqueEpisodes.forEach((episode) => {
    episodes += `<option value=${episode.episodeId}>${episode.episodeName}</option>`;
  });
  episodes += `</select>`;
  const outputGroup = document.createElement("div");
  outputGroup.classList.add("output-group");
  outputGroup.innerHTML = episodes;
  document.querySelector("#error").after(outputGroup);

  addEpisodeDropdownListener();
};

removeEpisodeDropdown = () => {
  const episodeFilter = document.getElementById("episodeFilter");
  if (episodeFilter) {
    episodeFilter.removeEventListener("change", () => {});
    episodeFilter.remove();
  }
};

const addEpisodeDropdownListener = () => {
  document.getElementById("episodeFilter").addEventListener("change", (e) => {
    clearRetrievalVals();
    document.getElementById("episodeId").value = e.target.value;
    getStatsByMethod("episodeId");
  });
};

const showError = (show = true, error = null) => {
  if (show) {
    console.log("error");
    document.getElementById("output").classList.toggle("hidden", true);
    document.getElementById("error").innerHTML = `${error}`;
    document.getElementById("error").classList.toggle("hidden", false);
  } else {
    document.getElementById("error").innerHTML = "";
    document.getElementById("output").classList.toggle("hidden", false);
    document.getElementById("error").classList.toggle("hidden", true);
  }
};

const showOutput = () => {
  document.getElementById("output").classList.toggle("hidden", false);
};

const clearRetrievalVals = () => {
  document.getElementById("userId").value = "";
  document.getElementById("episodeId").value = "";
  document.getElementById("shortUrl").value = "";
};

const handleRetrievalMethodSelect = (e) => {
  clearRetrievalVals();

  const currentButtonId = e.target.dataset.id;
  if (currentButtonId === "userId") {
    checkForUserId();
  } else {
    removeEpisodeDropdown();
  }

  document.querySelectorAll(".form-method").forEach((el) => {
    if (el.dataset.id === currentButtonId) {
      el.classList.toggle("hidden", false);
    } else {
      el.classList.toggle("hidden", true);
    }
  });
};

window.addEventListener("DOMContentLoaded", function () {
  init();
});
