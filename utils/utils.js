export function validateUrl(value) {
  return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(
    value
  );
}

export function validateEmail(email) {
  // Define a regular expression to match email addresses
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Use the regular expression to test the email address
  return emailRegex.test(email);
}

//validate that something is a link
export function validateShortUrl(value) {
  return /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi.test(
    value
  );
}

// export function toCamelCase(str) {
//   return str
//     .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
//       return index === 0 ? word.toLowerCase() : word.toUpperCase();
//     })
//     .replace(/\s+/g, "");
// }

export function toCamelCase(str) {
  // Remove any non-alphanumeric characters
  const alphanumericRegex = /[^\w\s]/g;
  str = str.replace(alphanumericRegex, '');

  // Convert the first letter of each word to uppercase
  const words = str.split(' ');
  for (let i = 0; i < words.length; i++) {
    words[i] = words[i][0].toUpperCase() + words[i].substr(1);
  }

  // Remove the spaces
  str = words.join('');

  // Return the result
  return str;

}