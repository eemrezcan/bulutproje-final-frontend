function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri.indexOf("/api/") !== 0 && uri !== "/" && uri.indexOf(".") === -1) {
    request.uri = "/index.html";
  }

  return request;
}
