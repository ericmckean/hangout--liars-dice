goog.provide('HangoutUserData');

goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.json');
goog.require('goog.object');

goog.scope(function() {

var Event = goog.events.Event;
var EventTarget = goog.events.EventTarget;
var base = goog.base;
var bind = goog.bind;
var json = goog.json;
var hangout = gapi.hangout;
var data = gapi.hangout.data;

/**
 * Synchronizes per-participant data across all participants.
 * TODO: Handle a participant rejoining.
 * TODO: Consider handling multiple ids from a single object.
 *
 * @param {string} id A unique id to be used to identify the shared data.
 * @param {*} initialValue The initial value for the local user.
 * @constructor
 */
HangoutUserData = function(id, initialValue) {
  if (id.indexOf('$') != -1) throw 'Ids cannot contain $.';

  base(this);

  this.id_ = id;
  this.keyPrefix_ = id + '$';
  this.key_ = this.keyPrefix_ + hangout.getParticipantId();
  this.dataCallback_ = bind(this.onStateChanged_, this);
  this.values_ = {};

  data.onStateChanged.add(this.dataCallback_);
  hangout.onEnabledParticipantsChanged.add(this.dataCallback_);
  this.setValue(initialValue);
  this.onStateChanged_();
};
goog.inherits(goog.hangouts.HangoutUserData, EventTarget);


HangoutUserData.VALUES_CHANGED_EVENT_TYPE = 'values-changed-event';


/**
 * @constructor
 */
HangoutUserData.ValuesChangedEvent = function(target, newValues) {
  base(this, HangoutUserData.VALUES_CHANGED_EVENT_TYPE, target);
  this.values = newValues;
};
goog.inherits(HangoutUserData.ValuesChangedEvent, Event);


/**
 * @constructor
 */
HangoutUserData.ParticipantChangedEvent = function(target, id, participant,
    value) {
  base (this, participant);
  this.id = id;
  this.participant = participant;
  this.value = value;
};
goog.inherits(HangoutUserData.ParticipantChangedEvent, Event);


HangoutUserData.prototype.disposeInternal = function() {
  data.onStateChanged.remove(this.dataCallback_);
  hangout.onParticipantDisabled.remove(this.dataCallback_);

  base(this, 'disposeInternal');
};


HangoutUserData.prototype.onStateChanged_ = function() {
  var state = data.getState();
  var newValues = {};
  goog.object.forEach(state, function(value, key) {
    if (key.indexOf(this.keyPrefix_) == 0) {
      var participant = key.substr(this.keyPrefix_.length);
      if (goog.isDefAndNotNull(gapi.hangout.getParticipantById(participant))) {
        var value = state[key];
        newValues[participant] = json.parse(value);
      }
    }
  }, this);

  var oldValues = this.values_;
  this.values_ = newValues;

  // overall change event
  this.dispatchEvent(new HangoutUserData.ValuesChangedEvent(this,
      goog.object.clone(this.values_)));

  // added/changed values
  goog.object.forEach(this.values_, function(value, key) {
    this.dispatchEvent(
        new HangoutUserData.ParticipantChangedEvent(this, this.id, key,
            this.values_[key]));
  }, this);

  // removed values
  goog.object.forEach(oldValues, function(value, key) {
    if (!(key in this.values_)) {
      this.dispatchEvent(
          new HangoutUserData.ParticipantChangedEvent(this, key,
              undefined));
    }
  }, this);
};


HangoutUserData.prototype.setValue = function(value) {
  var delta = {};
  delta[this.key_] = json.serialize(value);
  data.submitDelta(delta);
};


HangoutUserData.prototype.getValue = function(participant) {
  return this.values_[participant]
};


HangoutUserData.prototype.participants = function() {
  return goog.object.getKeys(this.values_);
};

}; // end scope
