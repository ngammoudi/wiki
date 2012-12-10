/**
 * Copyright (C) 2010 eXo Platform SAS.
 * 
 * This is free software; you can redistribute it and/or modify it under the
 * terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 * 
 * This software is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 * 
 * You should have received a copy of the GNU Lesser General Public License
 * along with this software; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA, or see the FSF
 * site: http://www.fsf.org.
 */

if (!eXo.wiki)
  eXo.wiki = {};

function UIConfirmBox() {
};

UIConfirmBox.prototype.init = function() {
  eXo.wiki.UIConfirmBox.closeConfirm();
};

UIConfirmBox.prototype.render = function(uicomponentId, titleMessage, message, submitClass, submitLabel, cancelLabel) {
   var me = eXo.wiki.UIConfirmBox;
  me.uicomponentId = uicomponentId;
  var buttonLabelArray = [submitLabel, cancelLabel];
  var callBackFunctionArray = [me.doAction, null];
  me.renderConfirmBox(uicomponentId, titleMessage, message, buttonLabelArray, callBackFunctionArray);
  return false;
};
 
UIConfirmBox.prototype.doAction = function()  {
  var me = eXo.wiki.UIConfirmBox;
  var action = document.getElementById(me.uicomponentId);
  var href = action.getAttribute("href");
  if (action && href) {
    window.location = href;
  }
};
 
UIConfirmBox.prototype.renderConfirmBox = function(componentId, titleMessage, message, buttonLabelArray, callBackFunctionArray) {
    var me = eXo.wiki.UIConfirmBox;
    
    // Build the confirm box
    me.confirmBox = $('<div/>', {
      'class' : 'ConfirmBox',
      align : 'center'
    }).append($('<div/>', {
      'class' : 'ConfirmBar'
    }).append($('<div/>', {
      'class' : 'ConfirmTitle',
      text : titleMessage
    }), $('<a/>', {
      'class' : 'CloseButton',
      href : 'javascript:eXo.wiki.UIConfirmBox.closeConfirm()'
    })));

    var container = $('<div/>').append($('<div/>', {
      'class' : 'ConfirmMessage',
      text : message
    }));
    
    // Create buttons
    for (i = 0; i < buttonLabelArray.length; i++) {
      if (buttonLabelArray[i]) {
        me.createInput(container, callBackFunctionArray[i], buttonLabelArray[i]);
      }
    }
    
    // Append confirm box to UI
    var component = document.getElementById(componentId);
    $(component).append($(me.confirmBox).append(container));
    
    // Create maskLayer
    this.maskLayer = eXo.core.UIMaskLayer.createMask("UIPortalApplication", me.confirmBox[0], 30);
    return false;
};

UIConfirmBox.prototype.createInput = function(container, callBackFunction, message) {
  $(container).append($('<input/>', {
    value: message,
    type: 'button',
    click: function(event) {
     if (callBackFunction){
       callBackFunction();
     }
     eXo.wiki.UIConfirmBox.closeConfirm();
    }
   }
  )
 )
};

UIConfirmBox.prototype.closeConfirm = function() {
  var me = eXo.wiki.UIConfirmBox;
  if (this.maskLayer) {
    eXo.core.UIMaskLayer.removeMask(this.maskLayer);
    this.maskLayer = null;
  }
  if (me.confirmBox) {
    $(me.confirmBox).remove();
    me.confirmBox = null;
  }
};

UIConfirmBox.prototype.resetPosition = function() {
  var me = eXo.wiki.UIConfirmBox;
  var confirmbox = me.confirmBox;

  if (confirmbox && ($(confirmbox).css('display') == "block")) {
    try {
      eXo.core.UIMaskLayer.blockContainer = document
          .getElementById("UIPortalApplication");
      eXo.core.UIMaskLayer.object = confirmbox;
      eXo.core.UIMaskLayer.setPosition();
    } catch (e) {
    }
  }
};

eXo.wiki.UIConfirmBox = new UIConfirmBox();
_module.UIConfirmBox = eXo.wiki.UIConfirmBox;
