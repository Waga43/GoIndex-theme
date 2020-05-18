import axios from "./axios";

const exts = [
  "html",
  "php",
  "css",
  "go",
  "java",
  "js",
  "json",
  "py",
  "txt",
  "sh",
  "md",
  "mp4",
  "webm",
  "mkv",
  "bmp",
  "jpg",
  "jpeg",
  "png",
  "gif",
];

export const checkoutPath = (path, file) => {
  // fix problem that CSS will also match
  var ext = path.split(".").length > 1 ? path.split(".").pop() : "";
  if (exts.indexOf(`${ext}`) >= 0) {
    path += "?a=view";
  } else {
    if (file.mimeType === "application/vnd.google-apps.folder") {
      if (path.substr(-1) !== "/") {
        path += "/";
      }
    }
  }
  return path;
};

export const getQueryString = (path, param) => {
  if (!path) {
    return "";
  }
  var args = getURLParameters(path);
  return args[param] ? args[param] : "";
};

export const getURLParameters = (url) =>
  url
    .match(/([^?=&]+)(=([^&]*))/g)
    .reduce(
      (a, v) => (
        (a[v.slice(0, v.indexOf("="))] = v.slice(v.indexOf("=") + 1)), a
      ),
      {}
    );

// console.log(getURLParameters("/Movies/xx.mp4?a=view&y=123"));

//console.log(getQueryString("/Movies/xx.mp4?a=view&y=123", "y"));

export function get_file(option, callback) {
  var path = option.path;
  var modifiedTime = option.file.modifiedTime;
  var key = "file_path_" + path + modifiedTime;
  var data = localStorage.getItem(key);
  data = "";
  if (data) {
    return callback(data);
  } else {
    axios.get(path).then((res) => {
      var data = res.data;
      localStorage.setItem(key, data);
      callback(data);
    });
  }
}

export function get_filex(path, callback) {
  axios.get(path).then((res) => {
    var data = res.data;
    callback(data);
  });
}

//Time conversion
export function utc2beijing(utc_datetime) {
  // Convert to normal time format year-month-day hour: minute: second
  var T_pos = utc_datetime.indexOf("T");
  var Z_pos = utc_datetime.indexOf("Z");
  var year_month_day = utc_datetime.substr(0, T_pos);
  var hour_minute_second = utc_datetime.substr(T_pos + 1, Z_pos - T_pos - 1);
  var new_datetime = year_month_day + " " + hour_minute_second; // 2017-03-31 08:02:06

  // Process to timestamp
  var timestamp = new Date(Date.parse(new_datetime));
  timestamp = timestamp.getTime();
  timestamp = timestamp / 1000;

  // 8 hours more, Beijing time is eight more time zones than UTC time
  var unixtimestamp = timestamp + 8 * 60 * 60;

  // Timestamp to time
  var unixtimestamp = new Date(unixtimestamp * 1000);
  var year = 1900 + unixtimestamp.getYear();
  var month = "0" + (unixtimestamp.getMonth() + 1);
  var date = "0" + unixtimestamp.getDate();
  var hour = "0" + unixtimestamp.getHours();
  var minute = "0" + unixtimestamp.getMinutes();
  var second = "0" + unixtimestamp.getSeconds();
  return (
    year +
    "-" +
    month.substring(month.length - 2, month.length) +
    "-" +
    date.substring(date.length - 2, date.length) +
    " " +
    hour.substring(hour.length - 2, hour.length) +
    ":" +
    minute.substring(minute.length - 2, minute.length) +
    ":" +
    second.substring(second.length - 2, second.length)
  );
}

export function formatFileSize(bytes) {
  if (bytes >= 1000000000) {
    bytes = (bytes / 1000000000).toFixed(2) + " GB";
  } else if (bytes >= 1000000) {
    bytes = (bytes / 1000000).toFixed(2) + " MB";
  } else if (bytes >= 1000) {
    bytes = (bytes / 1000).toFixed(2) + " KB";
  } else if (bytes > 1) {
    bytes = bytes + " bytes";
  } else if (bytes == 1) {
    bytes = bytes + " byte";
  } else {
    bytes = "";
  }
  return bytes;
}
