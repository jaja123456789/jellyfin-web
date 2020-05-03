import dialogHelper from 'dialogHelper';
import layoutManager from 'layoutManager';
import globalize from 'globalize';
import dom from 'dom';
import 'emby-button';
import 'css!./actionSheet';
import 'material-icons';
import 'scrollStyles';
import 'listViewStyle';

function getOffsets(elems) {

    var results = [];

    if (!document) {
        return results;
    }

    var box;
    for (let elem of elems) {
        // Support: BlackBerry 5, iOS 3 (original iPhone)
        // If we don't have gBCR, just use 0,0 rather than error
        if (elem.getBoundingClientRect) {
            box = elem.getBoundingClientRect();
        } else {
            box = { top: 0, left: 0 };
        }

        results.push({
            top: box.top,
            left: box.left,
            width: box.width,
            height: box.height
        });
    }

    return results;
}

function getPosition(options, dlg) {

    var windowSize = dom.getWindowSize();
    var windowHeight = windowSize.innerHeight;
    var windowWidth = windowSize.innerWidth;

    var pos = getOffsets([options.positionTo])[0];

    if (options.positionY !== 'top') {
        pos.top += (pos.height || 0) / 2;
    }

    pos.left += (pos.width || 0) / 2;

    var height = dlg.offsetHeight || 300;
    var width = dlg.offsetWidth || 160;

    // Account for popup size
    pos.top -= height / 2;
    pos.left -= width / 2;

    // Avoid showing too close to the bottom
    var overflowX = pos.left + width - windowWidth;
    var overflowY = pos.top + height - windowHeight;

    if (overflowX > 0) {
        pos.left -= (overflowX + 20);
    }
    if (overflowY > 0) {
        pos.top -= (overflowY + 20);
    }

    pos.top += (options.offsetTop || 0);
    pos.left += (options.offsetLeft || 0);

    // Do some boundary checking
    pos.top = Math.max(pos.top, 10);
    pos.left = Math.max(pos.left, 10);

    return pos;
}

function centerFocus(elem, horiz, on) {
    require(['scrollHelper'], function (scrollHelper) {
        var fn = on ? 'on' : 'off';
        scrollHelper.centerFocus[fn](elem, horiz);
    });
}

export function show(options) {

    // items
    // positionTo
    // showCancel
    // title
    var dialogOptions = {
        removeOnClose: true,
        enableHistory: options.enableHistory,
        scrollY: false
    };

    var backButton = false;
    var isFullscreen;

    if (layoutManager.tv) {
        dialogOptions.size = 'fullscreen';
        isFullscreen = true;
        backButton = true;
        dialogOptions.autoFocus = true;
    } else {

        dialogOptions.modal = false;
        dialogOptions.entryAnimation = options.entryAnimation;
        dialogOptions.exitAnimation = options.exitAnimation;
        dialogOptions.entryAnimationDuration = options.entryAnimationDuration || 140;
        dialogOptions.exitAnimationDuration = options.exitAnimationDuration || 100;
        dialogOptions.autoFocus = false;
    }

    var dlg = dialogHelper.createDialog(dialogOptions);

    if (isFullscreen) {
        dlg.classList.add('actionsheet-fullscreen');
    } else {
        dlg.classList.add('actionsheet-not-fullscreen');
    }

    dlg.classList.add('actionSheet');

    if (options.dialogClass) {
        dlg.classList.add(options.dialogClass);
    }

    var html = '';

    var scrollClassName = layoutManager.tv ? 'scrollY smoothScrollY hiddenScrollY' : 'scrollY';
    var style = '';

    // Admittedly a hack but right now the scrollbar is being factored into the width which is causing truncation
    if (options.items.length > 20) {
        var minWidth = dom.getWindowSize().innerWidth >= 300 ? 240 : 200;
        style += "min-width:" + minWidth + "px;";
    }

    var renderIcon = false;
    var icons = [];
    var itemIcon;
    for (let item of options.items) {

        itemIcon = item.icon || (item.selected ? 'check' : null);

        if (itemIcon) {
            renderIcon = true;
        }
        icons.push(itemIcon || '');
    }

    if (layoutManager.tv) {
        html += '<button is="paper-icon-button-light" class="btnCloseActionSheet hide-mouse-idle-tv" tabindex="-1"><i class="material-icons arrow_back"></i></button>';
    }

    // If any items have an icon, give them all an icon just to make sure they're all lined up evenly
    var center = options.title && (!renderIcon /*|| itemsWithIcons.length != options.items.length*/);

    if (center || layoutManager.tv) {
        html += '<div class="actionSheetContent actionSheetContent-centered">';
    } else {
        html += '<div class="actionSheetContent">';
    }

    if (options.title) {

        html += '<h1 class="actionSheetTitle">';
        html += options.title;
        html += '</h1>';
    }
    if (options.text) {
        html += '<p class="actionSheetText">';
        html += options.text;
        html += '</p>';
    }

    var scrollerClassName = 'actionSheetScroller';
    if (layoutManager.tv) {
        scrollerClassName += ' actionSheetScroller-tv focuscontainer-x focuscontainer-y';
    }
    html += '<div class="' + scrollerClassName + ' ' + scrollClassName + '" style="' + style + '">';

    var menuItemClass = 'listItem listItem-button actionSheetMenuItem';

    if (options.border || options.shaded) {
        menuItemClass += ' listItem-border';
    }

    if (options.menuItemClass) {
        menuItemClass += ' ' + options.menuItemClass;
    }

    if (layoutManager.tv) {
        menuItemClass += ' listItem-focusscale';
    }

    if (layoutManager.mobile) {
        menuItemClass += ' actionsheet-xlargeFont';
    }

    for (let [i, item] of options.items.entries()) {

        if (item.divider) {

            html += '<div class="actionsheetDivider"></div>';
            continue;
        }

        var autoFocus = item.selected && layoutManager.tv ? ' autoFocus' : '';

        // Check for null in case int 0 was passed in
        var optionId = item.id == null || item.id === '' ? item.value : item.id;
        html += '<button' + autoFocus + ' is="emby-button" type="button" class="' + menuItemClass + '" data-id="' + optionId + '">';

        itemIcon = icons[i];

        if (itemIcon) {

            html += '<i class="actionsheetMenuItemIcon listItemIcon listItemIcon-transparent material-icons">' + itemIcon + '</i>';
        } else if (renderIcon && !center) {
            html += '<i class="actionsheetMenuItemIcon listItemIcon listItemIcon-transparent material-icons" style="visibility:hidden;">check</i>';
        }

        html += '<div class="listItemBody actionsheetListItemBody">';

        html += '<div class="listItemBodyText actionSheetItemText">';
        html += (item.name || item.textContent || item.innerText);
        html += '</div>';

        if (item.secondaryText) {
            html += '<div class="listItemBodyText secondary">';
            html += item.secondaryText;
            html += '</div>';
        }

        html += '</div>';

        if (item.asideText) {
            html += '<div class="listItemAside actionSheetItemAsideText">';
            html += item.asideText;
            html += '</div>';
        }

        html += '</button>';
    }

    if (options.showCancel) {
        html += '<div class="buttons">';
        html += '<button is="emby-button" type="button" class="btnCloseActionSheet">' + globalize.translate('ButtonCancel') + '</button>';
        html += '</div>';
    }
    html += '</div>';

    dlg.innerHTML = html;

    if (layoutManager.tv) {
        centerFocus(dlg.querySelector('.actionSheetScroller'), false, true);
    }

    var btnCloseActionSheet = dlg.querySelector('.btnCloseActionSheet');
    if (btnCloseActionSheet) {
        dlg.querySelector('.btnCloseActionSheet').addEventListener('click', function () {
            dialogHelper.close(dlg);
        });
    }

    // Seeing an issue in some non-chrome browsers where this is requiring a double click
    //var eventName = browser.firefox ? 'mousedown' : 'click';
    var selectedId;

    var timeout;
    if (options.timeout) {
        timeout = setTimeout(function () {
            dialogHelper.close(dlg);
        }, options.timeout);
    }

    return new Promise(function (resolve, reject) {

        var isResolved;

        dlg.addEventListener('click', function (e) {

            var actionSheetMenuItem = dom.parentWithClass(e.target, 'actionSheetMenuItem');

            if (actionSheetMenuItem) {
                selectedId = actionSheetMenuItem.getAttribute('data-id');

                if (options.resolveOnClick) {

                    if (options.resolveOnClick.indexOf) {

                        if (options.resolveOnClick.indexOf(selectedId) !== -1) {

                            resolve(selectedId);
                            isResolved = true;
                        }

                    } else {
                        resolve(selectedId);
                        isResolved = true;
                    }
                }

                dialogHelper.close(dlg);
            }

        });

        dlg.addEventListener('close', function () {

            if (layoutManager.tv) {
                centerFocus(dlg.querySelector('.actionSheetScroller'), false, false);
            }

            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }

            if (!isResolved) {
                if (selectedId != null) {
                    if (options.callback) {
                        options.callback(selectedId);
                    }

                    resolve(selectedId);
                } else {
                    reject();
                }
            }
        });

        dialogHelper.open(dlg);

        var pos = options.positionTo && dialogOptions.size !== 'fullscreen' ? getPosition(options, dlg) : null;

        if (pos) {
            dlg.style.position = 'fixed';
            dlg.style.margin = 0;
            dlg.style.left = pos.left + 'px';
            dlg.style.top = pos.top + 'px';
        }
    });
}

export default {
    show: show
};
