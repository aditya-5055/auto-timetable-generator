/* static/js/main.js — TimetableGen */
document.addEventListener('DOMContentLoaded', function () {
  // Auto-dismiss success and info alerts after 4 seconds
  setTimeout(function () {
    document.querySelectorAll('.alert-success, .alert-info').forEach(function (el) {
      var a = bootstrap.Alert.getOrCreateInstance(el);
      if (a) a.close();
    });
  }, 4000);
});