//goog.provide('foo');

goog.require('HangoutUserData');

var readyStates;

var start = function() {
  readyStates = new goog.hangouts.HangoutUserData('ReadyState', false);

  function createDiv() {
    return document.createElement('div');
  }

  function createLabel(name) {
    var label = createDiv();
    label.style.display = 'inline-block';
    label.style.padding = '3px';
    label.style.margin = '5px';
    label.textContent = name;
    return label;
  }

  function createButton(label) {
    var button = createLabel(label);
    button.style.borderWidth = '1px';
    button.style.borderStyle = 'solid';
    return button;
  }

  function foreach(values, action) {
    for (var i = 0; i < values.length; i++) {
      action(values[i]);
    }
  }

  function ReadyList() {
    var that = this;
    this.element = createDiv();
    var participants = gapi.hangout.getParticipants();
    var nameOfParticipant = function(p) {
      return (p.person && p.person.displayName) + p.id;
    }
    var createParticipant = function(p) {
      var div = createDiv();
      div.appendChild(createLabel(nameOfParticipant(p)));
      div.appendChild(createButton(readyStates.getValue(p.id)));
      that.element.appendChild(div);
    }
    foreach(participants, createParticipant);
  }

  var list;
  function updateReadyList() {
    if (list) {
      document.body.removeChild(list.element);
    }
    list = new ReadyList();
    document.body.appendChild(list.element);
  }

  updateReadyList();
  readyStates.addEventListener(
      goog.hangouts.HangoutUserData.VALUES_CHANGED_EVENT_TYPE,
      updateReadyList);
};

gapi.hangout.onApiReady.add(start);
