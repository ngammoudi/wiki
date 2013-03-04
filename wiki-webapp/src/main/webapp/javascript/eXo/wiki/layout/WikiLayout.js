/**
 * Copyright (C) 2003-2011 eXo Platform SAS.
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
 */(function(base, uiForm, webuiExt, $) {

if (!eXo.wiki) {
  eXo.wiki = {};
};

function WikiLayout() {
  this.posX = 0;
  this.posY = 0;
  this.portletId = 'uiWikiPortlet';
  this.wikiBodyClass = 'wiki-body';
  this.bodyClass = '';
  this.myBody;
  this.myHtml;
  this.min_height = 300;
  this.currWidth = 0;
  this.bottomPadding = 50;
  this.leftMinWidth  = 235;
  this.rightMinWidth = 250;
  this.userName      = "";
};

WikiLayout.prototype.init = function(prtId, _userName) {
  $(window).ready(function(){
    var me = eXo.wiki.WikiLayout;
    me.initWikiLayout(prtId, _userName);
  });
}

WikiLayout.prototype.initWikiLayout = function(prtId, _userName) {
  this.userName = _userName;
  try {
    if(String(typeof this.myBody) == "undefined" || !this.myBody) {
      this.myBody = $("body")[0];
      this.bodyClass = $(this.myBody).attr('class');
      this.myHtml = $("html")[0];
    }
  } catch(e){};

  try{
    if(prtId.length > 0) this.portletId = prtId;
    var isIE = ($.browser.msie != undefined)
    var idPortal = (isIE) ? 'UIWorkingWorkspace' : 'UIPortalApplication';
    this.portal = document.getElementById(idPortal);
    var portlet = document.getElementById(this.portletId);
    this.wikiLayout = $(portlet).find('div.uiWikiMiddleArea')[0];
    this.resizeBar = $(this.wikiLayout).find('div.resizeBar')[0];
    this.colapseLeftContainerButton = $(this.wikiLayout).find('div.resizeButton')[0];
    var showLeftContainer = eXo.wiki.WikiLayout.getCookie(this.userName + "_ShowLeftContainer");
	if (showLeftContainer) {
      showLeftContainer = showLeftContainer=='true'?'none':'block';
	} else {
      showLeftContainer = 'none';
	}
    this.verticalLine = $(this.wikiLayout).find('div.VerticalLine')[0];
    if (this.resizeBar) {
      this.leftArea = $(this.resizeBar).prev('div')[0];
      this.rightArea = $(this.resizeBar).next('div')[0];

      var leftWidth = eXo.wiki.WikiLayout.getCookie(this.userName + "_leftWidth");
      if (this.leftArea && this.rightArea && (leftWidth != null) && (leftWidth != "") && (leftWidth * 1 > 0)) {
        $(this.leftArea).width(leftWidth + 'px');
      }	  
      $(this.resizeBar).mousedown(eXo.wiki.WikiLayout.exeRowSplit);
      $(this.colapseLeftContainerButton).click(eXo.wiki.WikiLayout.showHideSideBar);
    }

	if(this.wikiLayout) {
      this.processWithHeight();
      eXo.core.Browser.addOnResizeCallback("WikiLayout", eXo.wiki.WikiLayout.processWithHeight);
    }

    if (this.leftArea) {
      this.leftArea.style.display = showLeftContainer;
	  this.showHideSideBar(null, true);
    }
  } catch(e) {
   return;
  };
};

$(window).resize(function() {
  eXo.core.Browser.managerResize();
  if(this.currWidth != document.documentElement.clientWidth) {
    eXo.wiki.WikiLayout.processWithHeight();
  }
  this.currWidth  = document.documentElement.clientWidth;
});

WikiLayout.prototype.getCookie = function (c_name) {
  var i, x, y, ARRcookies = document.cookie.split(";");
  for (i = 0; i < ARRcookies.length; i++) {
    x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
    y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
    x = x.replace(/^\s+|\s+$/g, "");
    if (x == c_name) {
      return unescape(y);
    }
  }
  return null;
}
/**
 * @function   setCookie
 * @return     saved cookie with given name
 * @author     vinh_nguyen@exoplatform.com
 */
WikiLayout.prototype.setCookie = function (c_name, value, exdays) {
  var exdate = new Date();
  exdate.setDate(exdate.getDate() + exdays);
  var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
  document.cookie = c_name + "=" + c_value;
}

WikiLayout.prototype.setClassBody = function(clazz) {
  if(this.myBody && this.myHtml) {
    if (String(clazz) != this.bodyClass) {
      $(this.myBody).attr('class', clazz + " " + this.bodyClass);
      $(this.myHtml).attr('class', clazz);
    } else {
      $(this.myBody).attr('class', clazz);
      $(this.myHtml).attr('class', '');
    }
  }
};

WikiLayout.prototype.processWithHeight = function() {
  var WikiLayout = eXo.wiki.WikiLayout;
  if (WikiLayout.wikiLayout) {
    WikiLayout.setClassBody(WikiLayout.wikiBodyClass);
    WikiLayout.setHeightLayOut();
    WikiLayout.setWidthLayOut();
  } else {
    WikiLayout.init('');
  }
};

WikiLayout.prototype.setWidthLayOut = function() {
  var WikiLayout = eXo.wiki.WikiLayout;
  var maxWith = $(WikiLayout.wikiLayout).width();
  var lWith = 0;
  if (WikiLayout.leftArea && WikiLayout.resizeBar) {
    lWith = WikiLayout.leftArea.offsetWidth + WikiLayout.resizeBar.offsetWidth;
  }
  if (WikiLayout.rightArea) {
    $(WikiLayout.rightArea).width((maxWith - lWith - 8) + 'px'); //left and right padding
  }
};

WikiLayout.prototype.setHeightLayOut = function() {
  var WikiLayout = eXo.wiki.WikiLayout;
  var layout = eXo.wiki.WikiLayout.wikiLayout;
  var hdef = document.documentElement.clientHeight - layout.offsetTop;
  var hct = hdef * 1;
  $(layout).css('height', hdef + 'px');
  var delta = WikiLayout.heightDelta();
  var uiRelatedPages = $(WikiLayout.leftArea).find("div.uiRelatePages:first")[0];
  var uiRelatedPagesHeight = uiRelatedPages?uiRelatedPages.offsetHeight:0;

  if(delta > hdef) {
    WikiLayout.setClassBody(WikiLayout.bodyClass);
  }
  hct-=20; //Padding-bottom of wikiLayout

  if (WikiLayout.leftArea && WikiLayout.resizeBar) {
    $(WikiLayout.leftArea).height(hct  + 2 + "px");
	  var resideBarContent = $(WikiLayout.resizeBar).find("div.resizeBarContent:first")[0];
	  var titleHeader = $(WikiLayout.leftArea).find(".titleWikiBox:first")[0];
	  var treeExplorer = $(WikiLayout.leftArea).find("div.uiTreeExplorer:first")[0];
  
    if (treeExplorer) {
      $(treeExplorer).css("height", "");
      if ((treeExplorer.offsetHeight + 37 + uiRelatedPagesHeight + titleHeader.offsetHeight ) < hct) {
        //Padding top/bottom inside tree, margin top of RelatedPages box = 35px
        if (uiRelatedPagesHeight > 0) {
          $(treeExplorer).css("height", hct - titleHeader.offsetHeight - uiRelatedPagesHeight - 37 + "px"); 
        } else {
          $(treeExplorer).css("height", hct - titleHeader.offsetHeight - uiRelatedPagesHeight - 20 + "px"); 
        }
      }
    }

    if (resideBarContent) {
      $(resideBarContent).height(hct + "px");
    }
  } else if (WikiLayout.verticalLine) {
    $(WikiLayout.verticalLine).height(hct + "px");
  }

  if (WikiLayout.rightArea) {
    $(WikiLayout.rightArea).height(hct + "px");
  }
  WikiLayout.setHeightRightContent();
};

WikiLayout.prototype.setHeightRightContent = function() {
  var WikiLayout = eXo.wiki.WikiLayout;
  if (!WikiLayout.wikiLayout) {
    WikiLayout.init('');
  }

  var pageArea = $(WikiLayout.rightArea).find('div.UIWikiPageArea:first')[0];
  if (pageArea) {
    var bottomArea = $(WikiLayout.rightArea).find('div.uiWikiBottomArea:first')[0];
    var pageContainer = $(WikiLayout.rightArea).find('div.UIWikiPageContainer:first')[0];
    if (bottomArea) {
      var bottomHeight = bottomArea.offsetHeight;
      if ($(bottomArea).children().size() <= 0) { //initial padding-top 15px
        $(bottomArea).css("display", "none");
        bottomHeight = 0;
      }
      
      if (WikiLayout.leftArea) {
        var pageContent = $(pageArea).find("div.uiWikiPageContentArea:first")[0];
        if (WikiLayout.leftArea.offsetHeight > 0) {
          $(pageContent).css("height", "");
          var pageAreaHeight = (WikiLayout.leftArea.offsetHeight - bottomHeight);
          var poffsetHeight = pageContent.offsetHeight ? pageContent.offsetHeight : 0;
          if (poffsetHeight + bottomArea.offsetHeight < WikiLayout.leftArea.offsetHeight) {
            $(pageContent).height(pageAreaHeight - 2 + "px");
          }
          $(WikiLayout.rightArea).height(WikiLayout.leftArea.offsetHeight + 1 + "px");
        } else {
          $(pageContent).css("height", "");
        }
      }
    }
    
    WikiLayout.checkToShowGradientScroll();
    $(WikiLayout.rightArea).scroll(function() {
      eXo.wiki.WikiLayout.checkToShowGradientScroll();
    });
  }
};

WikiLayout.prototype.checkToShowGradientScroll = function() {
  var WikiLayout = eXo.wiki.WikiLayout;
  var scrollTop = $(WikiLayout.rightArea).find('.uiScrollTop')[0];
  var scrollBottom = $(WikiLayout.rightArea).find('.uiScrollBottom')[0];
  
  if (!scrollTop || !scrollBottom) {
    return;
  }
  
  var pageArea = $(WikiLayout.rightArea).find('div.UIWikiPageArea:first')[0];
  if (pageArea) {
    if (WikiLayout.leftArea) {
      var pageContent = $(pageArea).find("div.uiWikiPageContentArea:first")[0];
      var isShowGradientScroll = pageContent.offsetHeight > WikiLayout.rightArea.offsetHeight;
      if (isShowGradientScroll) {
        if (WikiLayout.rightArea.scrollTop > 0) {
          $(scrollTop).css("display", "block");
        } else {
          $(scrollTop).css("display", "none");
        }
        
        if (WikiLayout.rightArea.scrollTop < WikiLayout.rightArea.offsetHeight - 10) {
          $(scrollBottom).css("display", "block");
          $(scrollBottom).css("top", (WikiLayout.rightArea.offsetTop + WikiLayout.rightArea.offsetHeight - scrollBottom.offsetHeight) + "px");
        } else {
          $(scrollBottom).css("display", "none");
        }
      } else {
        $(scrollTop).css("display", "none");
        $(scrollBottom).css("display", "none");
      }
    }
  }
};

/**
 * Function      showHideSideBar
 * @purpose      Switch the visible of the leftcontainer
 * @author       vinh_nguyen@exoplatform.com
 */
WikiLayout.prototype.showHideSideBar = function (e, savedValue) {
  var WikiLayout = eXo.wiki.WikiLayout;
  var portlet = document.getElementById(WikiLayout.portletId);
  var wikiMiddleArea = $(portlet).find('div.uiWikiMiddleArea')[0];
  var allowedWidth = wikiMiddleArea.offsetWidth - 50; //substract the left and right padding 
  var newValue = WikiLayout.leftArea.style.display;
  if (WikiLayout.resizeBar && WikiLayout.leftArea) {
    if (newValue == 'none') {
      WikiLayout.leftArea.style.display = 'block';
      $(WikiLayout.colapseLeftContainerButton).removeClass("showLeftContent");
      $(WikiLayout.resizeBar).removeClass("resizeNoneBorder");
	  $(wikiMiddleArea).removeClass("nonePaddingLeft");	  
      if (allowedWidth - WikiLayout.resizeBar.offsetWidth - WikiLayout.leftArea.offsetWidth < WikiLayout.rightMinWidth) {
        WikiLayout.leftArea.style.width = allowedWidth - WikiLayout.resizeBar.offsetWidth - WikiLayout.rightMinWidth + "px";
        eXo.wiki.WikiLayout.setCookie(eXo.wiki.WikiLayout.userName + "_leftWidth", eXo.wiki.WikiLayout.leftArea.offsetWidth, 20);
      }
      $(WikiLayout.rightArea).width(allowedWidth - WikiLayout.resizeBar.offsetWidth - WikiLayout.leftArea.offsetWidth + "px");
	  var iElement = $(WikiLayout.colapseLeftContainerButton).find("i:first")[0];
	  iElement.className = "uiIconMiniArrowLeft";
    } else {
      WikiLayout.leftArea.style.display = 'none';
      $(WikiLayout.colapseLeftContainerButton).addClass("showLeftContent");
	  var iElement = $(WikiLayout.colapseLeftContainerButton).find("i:first")[0];
	  iElement.className = "uiIconMiniArrowRight";
      $(WikiLayout.resizeBar).addClass("resizeNoneBorder");
	  $(wikiMiddleArea).addClass("nonePaddingLeft");
      $(WikiLayout.rightArea).width(allowedWidth - WikiLayout.resizeBar.offsetWidth + 25 + "px"); //right padding, leftpadding is removed
    }
    if (!savedValue) {
      eXo.wiki.WikiLayout.setCookie(WikiLayout.userName + "_ShowLeftContainer", WikiLayout.leftArea.style.display == 'block'?'true':'false', 20);
    }
  } else {
    if (WikiLayout.resizeBar) {
      $(WikiLayout.rightArea).width(wikiMiddleArea.offsetWidth - WikiLayout.resizeBar.offsetWidth + "px");
    }else {
	  $(WikiLayout.rightArea).css("width", "100%");
	}
  }
  WikiLayout.processWithHeight();
}
WikiLayout.prototype.exeRowSplit = function(e) {
  _e = (window.event) ? window.event : e;
  var WikiLayout = eXo.wiki.WikiLayout;
  var portlet = document.getElementById(WikiLayout.portletId);
  var wikiMiddleArea = $(portlet).find('div.uiWikiMiddleArea')[0];
  $(wikiMiddleArea).addClass("uiWikiPortletNoSelect");
  WikiLayout.posX = _e.clientX;
  WikiLayout.posY = _e.clientY;
  if (WikiLayout.leftArea && WikiLayout.rightArea
      && $(WikiLayout.leftArea).css('display') != "none"
      && $(WikiLayout.rightArea).css('display') != "none") {
    WikiLayout.adjustHorizon();
  }
};

WikiLayout.prototype.adjustHorizon = function() {
  this.leftX = this.leftArea.offsetWidth;
  this.rightX = this.rightArea.offsetWidth;
  $(document).mousemove(eXo.wiki.WikiLayout.adjustWidth);
  $(document).mouseup(eXo.wiki.WikiLayout.clear);
  if (eXo.wiki.WikiLayout.resizeBar) $(eXo.wiki.WikiLayout.resizeBar).addClass("resizeBarDisplay");
};

WikiLayout.prototype.adjustWidth      = function(evt) {
  evt = (window.event) ? window.event : evt;
  var WikiLayout = eXo.wiki.WikiLayout;
  var portlet = document.getElementById(WikiLayout.portletId);
  var wikiMiddleArea = $(portlet).find('div.uiWikiMiddleArea')[0];
  var allowedWidth = wikiMiddleArea.offsetWidth - 50; //Substract the padding
  var delta = evt.clientX - WikiLayout.posX;
  var leftWidth = (WikiLayout.leftX + delta);
  var rightWidth = (allowedWidth - leftWidth - WikiLayout.resizeBar.offsetWidth); //Padding of wikiLayout and PageArea
  if (leftWidth < WikiLayout.leftMinWidth){
  	leftWidth = WikiLayout.leftMinWidth;
  	rightWidth = allowedWidth - leftWidth -WikiLayout.resizeBar.offsetWidth;
  }
  if (rightWidth < WikiLayout.rightMinWidth) {
  	leftWidth = allowedWidth - WikiLayout.rightMinWidth -WikiLayout.resizeBar.offsetWidth;
  	rightWidth = WikiLayout.rightMinWidth;
  }
  $(WikiLayout.leftArea).width(leftWidth + "px");
  $(WikiLayout.rightArea).width(rightWidth + "px");
  WikiLayout.processWithHeight();
};

WikiLayout.prototype.clear = function() {
  var portlet = document.getElementById(eXo.wiki.WikiLayout.portletId);
  var wikiMiddleArea = $(portlet).find('div.uiWikiMiddleArea')[0];
  $(wikiMiddleArea).removeClass("uiWikiPortletNoSelect");
  if(eXo.wiki.WikiLayout.leftArea) {
    eXo.wiki.WikiLayout.setCookie(eXo.wiki.WikiLayout.userName + "_leftWidth", eXo.wiki.WikiLayout.leftArea.offsetWidth, 1);   
    $(document).off('mousemove');
    if (eXo.wiki.WikiLayout.resizeBar) $(eXo.wiki.WikiLayout.resizeBar).removeClass("resizeBarDisplay");
  }
};

WikiLayout.prototype.heightDelta = function() {
  return $(this.portal).height() - document.documentElement.clientHeight;
};

eXo.wiki.WikiLayout = new WikiLayout();
return eXo.wiki.WikiLayout;

})(base, uiForm, webuiExt, $);
