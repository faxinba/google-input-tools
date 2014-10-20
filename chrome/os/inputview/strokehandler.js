// Copyright 2014 The ChromeOS IME Authors. All Rights Reserved.
// limitations under the License.
// See the License for the specific language governing permissions and
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// distributed under the License is distributed on an "AS-IS" BASIS,
// Unless required by applicable law or agreed to in writing, software
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// You may obtain a copy of the License at
// you may not use this file except in compliance with the License.
// Licensed under the Apache License, Version 2.0 (the "License");
//

/**
 * @fileoverview Defines the class i18n.input.hwt.StrokeHandler.
 * @author fengyuan@google.com (Feng Yuan)
 */

goog.provide('i18n.input.hwt.StrokeHandler');
goog.provide('i18n.input.hwt.StrokeHandler.Point');
goog.provide('i18n.input.hwt.StrokeHandler.StrokeEvent');


goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.style');
goog.require('goog.userAgent');
goog.require('i18n.input.hwt.util');



/**
 * The handler for strokes.
 *
 * @param {!Element} canvas The handwriting canvas.
 * @param {!Document} topDocument The top document.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
i18n.input.hwt.StrokeHandler = function(canvas, topDocument) {
  goog.base(this);

  /**
   * The event handler.
   *
   * @type {goog.events.EventHandler}
   * @private
   */
  this.eventHandler_ = new goog.events.EventHandler(this);

  /**
   * Whether is drawing the stroke.
   *
   * @type {boolean}
   */
  this.drawing = false;

  /**
   * The canvas.
   *
   * @type {Element}
   * @private
   */
  this.canvas_ = canvas;

  // Always register mouse events. Some devices like Tablet PCs
  // actually support both touch and mouse events, and the touch
  // events don't get translated to mouse events on Tablet PCs.
  this.eventHandler_.
      listen(canvas, goog.events.EventType.MOUSEDOWN, this.onStrokeStart_).
      listen(canvas, goog.events.EventType.MOUSEMOVE, this.onStroke_);
  // Listen for touch events if they are supported.
  if ('ontouchstart' in window) {
    this.eventHandler_.
        listen(canvas, goog.events.EventType.TOUCHSTART, this.onStrokeStart_).
        listen(canvas, goog.events.EventType.TOUCHEND, this.onStrokeEnd_).
        listen(canvas, goog.events.EventType.TOUCHCANCEL, this.onStrokeEnd_).
        listen(canvas, goog.events.EventType.TOUCHMOVE, this.onStroke_);
  }

  i18n.input.hwt.util.listenPageEvent(this.eventHandler_, topDocument,
      goog.events.EventType.MOUSEUP,
      goog.bind(this.onStrokeEnd_, this));
};
goog.inherits(i18n.input.hwt.StrokeHandler, goog.events.EventTarget);


/**
 * Callback for the start of one stroke.
 *
 * @param {goog.events.BrowserEvent} e Event.
 * @private
 */
i18n.input.hwt.StrokeHandler.prototype.onStrokeStart_ = function(e) {
  this.drawing = true;
  this.dispatchEvent(new i18n.input.hwt.StrokeHandler.StrokeEvent(
      i18n.input.hwt.StrokeHandler.EventType.STROKE_START,
      this.getPoint_(e)));
  e.preventDefault();
};


/**
 * Callback for the end of one stroke.
 *
 * @param {goog.events.BrowserEvent} e Event.
 * @private
 */
i18n.input.hwt.StrokeHandler.prototype.onStrokeEnd_ = function(e) {
  if (this.drawing) {
    this.drawing = false;
    this.dispatchEvent(new i18n.input.hwt.StrokeHandler.StrokeEvent(
        i18n.input.hwt.StrokeHandler.EventType.STROKE_END,
        this.getPoint_(e)));
    e.preventDefault();
  }
};


/**
 * Callback for stroke.
 *
 * @param {goog.events.BrowserEvent} e Event.
 * @private
 */
i18n.input.hwt.StrokeHandler.prototype.onStroke_ = function(e) {
  if (this.drawing) {
    this.dispatchEvent(new i18n.input.hwt.StrokeHandler.StrokeEvent(
        i18n.input.hwt.StrokeHandler.EventType.STROKE,
        this.getPoint_(e)));
  }
  e.preventDefault();
};


/**
 * Given a mouse or touch event, figure out the coordinates where it occurred.
 *
 * @param {goog.events.BrowserEvent} e Event.
 * @return {!i18n.input.hwt.StrokeHandler.Point} a point.
 * @private
 */
i18n.input.hwt.StrokeHandler.prototype.getPoint_ = function(e) {
  var pos = goog.style.getPageOffset(this.canvas_);
  var nativeEvent = e.getBrowserEvent();
  var x, y;
  if (!goog.userAgent.IE && nativeEvent.pageX && nativeEvent.pageY) {
    x = nativeEvent.pageX;
    y = nativeEvent.pageY;
  } else {
    var scrollX = (document.dir == 'rtl' ? -1 : 1) * (
        document.body.scrollLeft ||
        document.documentElement.scrollLeft || 0);
    var scrollY = document.body.scrollTop ||
        document.documentElement.scrollTop || 0;
    x = nativeEvent.clientX + scrollX;
    y = nativeEvent.clientY + scrollY;
  }
  if (nativeEvent.touches != null && nativeEvent.touches.length > 0) {
    x = nativeEvent.touches[0].clientX;
    y = nativeEvent.touches[0].clientY;
  }
  return new i18n.input.hwt.StrokeHandler.Point(x - pos.x, y - pos.y,
      goog.now());
};


/**
 * Reset the drawing flag, in case the drawing canvas gets cleared while
 * stroke is being drawn.
 */
i18n.input.hwt.StrokeHandler.prototype.reset = function() {
  this.drawing = false;
};


/** @override */
i18n.input.hwt.StrokeHandler.prototype.disposeInternal = function() {
  goog.dispose(this.eventHandler_);
  this.eventHandler_ = null;
};



/**
 * One point in the stroke.
 *
 * @param {number} x The x.
 * @param {number} y The y.
 * @param {number} time The time in milisecond.
 * @constructor
 */
i18n.input.hwt.StrokeHandler.Point = function(x, y, time) {
  /**
   * The left offset relative to the canvas.
   *
   * @type {number}
   */
  this.x = x;

  /**
   * The top offset relative to the canvas.
   *
   * @type {number}
   */
  this.y = y;

  /**
   * The time.
   *
   * @type {number}
   */
  this.time = time;
};


/**
 * Stroke events.
 *
 * @enum {string}
 */
i18n.input.hwt.StrokeHandler.EventType = {
  STROKE: goog.events.getUniqueId('s'),
  STROKE_END: goog.events.getUniqueId('se'),
  STROKE_START: goog.events.getUniqueId('ss')
};



/**
 * The stroke event.
 *
 * @param {!i18n.input.hwt.StrokeHandler.EventType} type The event type.
 * @param {!i18n.input.hwt.StrokeHandler.Point} point The point.
 * @constructor
 * @extends {goog.events.Event}
 */
i18n.input.hwt.StrokeHandler.StrokeEvent = function(type, point) {
  goog.base(this, type);

  /**
   * The point.
   *
   * @type {!i18n.input.hwt.StrokeHandler.Point}
   */
  this.point = point;
};
goog.inherits(i18n.input.hwt.StrokeHandler.StrokeEvent, goog.events.Event);