function handleCredentialResponse(e) {
  console.log("auth", e);
}

// gapi.analytics.ready(function () {
//   // Step 3: Authorize the user.

//   // var CLIENT_ID = "108901188668516974494";
//   const CLIENT_ID =
//     "123270247522-vkcb0qsa4dcoa9tdjd1kbolb00q71fim.apps.googleusercontent.com";

//   gapi.analytics.auth.authorize({
//     container: "auth-button",
//     clientid: CLIENT_ID,
//   });

//   // Step 4: Create the view selector.

//   var viewSelector = new gapi.analytics.ViewSelector({
//     container: "view-selector",
//   });

//   // Step 5: Create the timeline chart.

//   var timeline = new gapi.analytics.googleCharts.DataChart({
//     reportType: "ga",
//     query: {
//       dimensions: "ga:date",
//       metrics: "ga:sessions",
//       "start-date": "30daysAgo",
//       "end-date": "yesterday",
//     },
//     chart: {
//       type: "LINE",
//       container: "timeline",
//     },
//   });

//   // Step 6: Hook up the components to work together.

//   gapi.analytics.auth.on("success", function (response) {
//     viewSelector.execute();
//   });

//   viewSelector.on("change", function (ids) {
//     var newIds = {
//       query: {
//         ids: ids,
//       },
//     };
//     timeline.set(newIds).execute();
//   });
// });
