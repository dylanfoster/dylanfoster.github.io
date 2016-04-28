(function () {"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function makeArray(args) {
  return Array.from(args);
}

var EventedElement = function () {
  function EventedElement(element) {
    _classCallCheck(this, EventedElement);

    this.element = element;
  }

  _createClass(EventedElement, [{
    key: "addClass",
    value: function addClass(className) {
      return this.element.classList.add(className);
    }
  }, {
    key: "addEvent",
    value: function addEvent(event, handler) {
      return this.element.addEventListener(event, handler);
    }
  }, {
    key: "find",
    value: function find(el) {
      return new EventedElement(this.element.querySelector(el));
    }
  }, {
    key: "removeClass",
    value: function removeClass(className) {
      this.element.classList.remove(className);
    }
  }]);

  return EventedElement;
}();

function easeInOutSine(duration, elapsed, start, end) {
  return Math.round(-end / 2 * (Math.cos(Math.PI * elapsed / duration) - 1) + start);
}

var AnchorScroll = function (_EventedElement) {
  _inherits(AnchorScroll, _EventedElement);

  function AnchorScroll(element) {
    _classCallCheck(this, AnchorScroll);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(AnchorScroll).call(this, element));

    _this.container = new EventedElement(_this.element.parentNode);
    _this.siblings = makeArray(_this.element.parentNode.parentNode.children).map(function (child) {
      return new EventedElement(child);
    });
    _this.addEvent("click", _this.scroll.bind(_this));
    return _this;
  }

  _createClass(AnchorScroll, [{
    key: "animateScroll",
    value: function animateScroll(target, hash, rect, topMost) {
      var coordinates = this.getCoordinates(target);

      if (!coordinates) {
        return;
      }
      var duration = 1000;
      var progress = new Map([["duration", duration], ["elapsed", 0]]);
      var start = performance.now();

      function tick(timestamp) {
        progress.set("elapsed", timestamp - start);
        document.body.scrollTop = easeInOutSine.apply(undefined, _toConsumableArray(progress.values()).concat(_toConsumableArray(coordinates.values())));

        if (progress.get("elapsed") < progress.get("duration")) {
          return requestAnimationFrame(tick.bind(this));
        }

        this.complete(hash, coordinates);
      }

      requestAnimationFrame(tick.bind(this));
    }
  }, {
    key: "complete",
    value: function complete(hash, coordinates) {
      history.pushState(null, null, hash);
      document.body.scrollTop = coordinates.get("start") + coordinates.get("delta");
    }
  }, {
    key: "getCoordinates",
    value: function getCoordinates(element) {
      var start = document.body.scrollTop;
      var top = element.getBoundingClientRect().top;
      var max = document.body.scrollHeight - window.innerHeight;
      var delta = start + top < max ? top : max - start;

      if (delta) {
        return new Map([["start", start], ["delta", delta]]);
      }
    }
  }, {
    key: "scroll",
    value: function scroll(e) {
      e.preventDefault();
      var hash = this.element.hash;
      var target = document.querySelector(hash);

      this.siblings.forEach(function (sibling) {
        return sibling.removeClass("active");
      });
      this.container.addClass("active");

      this.animateScroll(target, hash);
    }
  }]);

  return AnchorScroll;
}(EventedElement);

var Waypoint = function (_EventedElement2) {
  _inherits(Waypoint, _EventedElement2);

  function Waypoint(element, options) {
    _classCallCheck(this, Waypoint);

    var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(Waypoint).call(this, element));

    _this2.animations = [];

    options.animations.forEach(function (animation) {
      _this2.animations.push({
        element: new EventedElement(document.querySelector(animation.element)),
        class: animation.class
      });
    });
    return _this2;
  }

  _createClass(Waypoint, [{
    key: "runAnimations",
    value: function runAnimations() {
      if (this.animations.length) {
        this.animations.forEach(function (animation) {
          animation.element.addClass(animation.class);
        });
      }
    }
  }, {
    key: "check",
    value: function check() {
      var target = this.element.getBoundingClientRect().top;

      if (target <= 50) {
        this.runAnimations();
      }
    }
  }]);

  return Waypoint;
}(EventedElement);

var anchors = makeArray(document.querySelectorAll("a[data-scroll]"));
var hash = window.location.hash;

anchors.map(function (anchor) {
  return new AnchorScroll(anchor);
});

// add active link on refresh if hash is present
if (hash) {
  var activeLink = anchors.filter(function (anchor) {
    return anchor.hash === hash;
  })[0].parentNode;

  activeLink.classList.add("active");
}

function setSectionHighlight() {
  var currentPos = window.scrollY;
  var windowHeight = window.innerHeight;
  var docHeight = document.body.clientHeight;

  for (var i = 0; i < anchors.length; i++) {
    var id = anchors[i].hash;
    var section = document.getElementById(id.replace(/#/, "")).parentNode;
    var sectionTop = section.getBoundingClientRect().top;
    var sectionHeight = section.offsetHeight;

    if (sectionTop <= 0 && Math.abs(sectionTop) < sectionHeight) {
      anchors[i].parentNode.classList.add("active");
    } else {
      anchors[i].parentNode.classList.remove("active");
    }
  }

  if (currentPos + windowHeight >= docHeight) {
    // add active to last anchor
    var lastAnchor = anchors[anchors.length - 1];
    if (!lastAnchor.parentNode.classList.contains("active")) {
      anchors.forEach(function (anchor) {
        return anchor.parentNode.classList.remove("active");
      });
      lastAnchor.parentNode.classList.add("active");
    }
  }
}

var about = document.getElementById("about");
var projects = document.getElementById("projects");
var aboutWayPoint = new Waypoint(about, {
  animations: [{ element: ".profile-image", class: "show" }, { element: ".section_about__content", class: "show" }, { element: ".quote", class: "show" }]
});
var projectsWaypoint = new Waypoint(projects, {
  animations: [{ element: "#AniFit", class: "show" }, { element: "#Bonfire", class: "show" }, { element: "#Hotcakes", class: "show" }, { element: "#Twitter", class: "show" }, { element: "#Google", class: "show" }, { element: "#Apple", class: "show" }, { element: "#TopSecret", class: "show" }]
});

window.onscroll = function (e) {
  setSectionHighlight();
  aboutWayPoint.check();
  projectsWaypoint.check();
};

var map = void 0;

function loadMap() {
  var mapContainer = document.querySelector(".map");

  map = new google.maps.Map(mapContainer, {
    center: { lat: 37.338208, lng: -121.886329 },
    scrollwheel: false,
    zoom: 15
  });
}

window.loadMap = loadMap;

if ("ontouchstart" in document.documentElement) {
  document.documentElement.className += "touch";
}

function trackClick(element) {
  var tracks = element.getAttribute("data-track").split(";");
  var props = {};

  tracks.forEach(function (track) {
    var parts = track.split(":");

    props[parts[0]] = parts[1];
  });

  element.addEventListener("click", function (e) {
    ga("send", "event", props.type, "click", props.label);
  });
}

var elementsToTrack = makeArray(document.querySelectorAll("a[data-track]"));

elementsToTrack.forEach(trackClick);})();
//# sourceMappingURL=../maps/app.js.map
