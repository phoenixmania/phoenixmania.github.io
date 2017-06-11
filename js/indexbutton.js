'use strict';

function $(expr, context) {
  return (context || document).querySelector(expr);
}

function $$(expr, context) {
  return Array.prototype.slice.call((context || document).querySelectorAll(expr), 0);
}

(function (d) {
  $('.btn-toggle').addEventListener('click', function (_) {
    return d.body.classList.toggle('toggle');
  });

  $$('.btn-md').forEach(function (button) {
    button.addEventListener('click', function (_) {
      return button.classList.toggle('inactive');
    });
  });
})(document);

document.addEventListener("DOMContentLoaded", function (_) {
  var index = 1;
  var clickEvent = new CustomEvent("click", {});
  var buttons = $$('.btn-md');
  buttons.forEach(function (button) {
    (function (button) {
      setTimeout(function () {
        button.dispatchEvent(clickEvent);
      }, 500 + 150 * index++);
    })(button);
    (function (button) {
      setTimeout(function (_) {
        button.dispatchEvent(clickEvent);
      }, 5500 + 200 * index++);
    })(button);
    setTimeout(function (_) {
      $('.btn-toggle').dispatchEvent(clickEvent);
    }, 5000);
  });
});